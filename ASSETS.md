# Character Asset Contract

What phase 2 must deliver. **No assets exist yet** — this file and the types at
the bottom of [src/lib/rules/character.ts](src/lib/rules/character.ts) are the
whole specification.

Every budget below is derived from measurements taken against the phase 1
spike, not from guesses. The measurement conditions are stated so you can
re-derive them if the container or the target hardware changes.

---

## 1. Location and naming

```
public/
  characters/
    <characterId>.glb        one file per creature
```

- `characterId` is `[a-z0-9-]+`, lowercase kebab. It is persisted verbatim in
  `habits.character_id` and used to build the URL, so it must be URL-safe.
- The path is produced by `modelPath()` in `character.ts`; nothing else should
  construct it.
- **One file per creature, not per colourway.** See §5.
- `public/characters/` must be committed, unlike `public/generated/` which is
  gitignored. These are authored assets, not generated output.

---

## 2. Format

- **glTF 2.0 binary (`.glb`)**, single file, **textures embedded**.
  Not `.gltf` + loose files: the app has no asset manifest, and a single
  request per character keeps loading logic trivial.
- Meshes triangulated. No quads, no n-gons.
- One skinned mesh per file where possible. Every extra mesh is an extra draw
  call, and this scene is otherwise nearly free.
- Materials must be **PBR metallic-roughness** (glTF core). Do not rely on
  `KHR_materials_*` extensions — three.js supports several, but the loader
  configuration in phase 2 will be plain `GLTFLoader`, so anything exotic will
  silently drop.
- Draco/meshopt compression: **not for now.** It needs a decoder to be wired
  up and hosted, and the budgets below are comfortably met uncompressed.
  Revisit only if a creature cannot fit §3.

---

## 3. Budgets

### Triangles

**Target 8,000 per character. Hard cap 15,000.**

Measured basis. A raw WebGL2 throughput test at the real drawing-buffer size
(298×597, i.e. a 448px card at DPR 2), running in headless Chrome on
**SwiftShader — a pure CPU software rasteriser, which is the worst renderer any
real user will have**:

| triangles | ms/frame | fps |
|---:|---:|---:|
| 1,000 | 0.77 | 1299 |
| 2,500 | 1.50 | 667 |
| 5,000 | 2.63 | 380 |
| 10,000 | 4.70 | 213 |
| 20,000 | 8.38 | 119 |
| 40,000 | 15.84 | 63 |
| 80,000 | 30.03 | 33 |

60fps on the software rasteriser breaks down at ~40,000 triangles. The 15,000
cap leaves roughly a 2.5x margin against that floor, which covers the two
things the synthetic test does not model: GPU skinning cost, and the fact that
the browser is also compositing the rest of the page. On any actual GPU this is
not a constraint at all.

For reference, the phase 1 placeholder capsule is **1,632 triangles** and the
full app scene renders at **6ms/frame median (166fps)** on the same software
rasteriser.

A stylised character at this size has no business being near the cap: it is
displayed **74–106 CSS pixels wide** (start through elite). 8,000 triangles is
already generous.

### File size

**Target 1.5 MB per `.glb`. Hard cap 3 MB.**

Measured basis, for a sense of proportion against what the app already ships:

| Asset | Size |
|---|---|
| One AI background PNG (1024²) | 720 KB – 1.26 MB, mean **990 KB** |
| Entire JS bundle, gzipped | **412 KB** |
| The three.js chunk alone, gzipped | **231 KB** |

A character is downloaded once and reused on every visit, whereas a background
is already ~1 MB. Sitting at or under one background image is the right target.
GLB is largely already-compressed texture data, so gzip will not help much —
budget against the raw file size.

### Textures

- **512×512 is the target. 1024×1024 is the maximum.**
  The character is at most 106 CSS px wide, so 212 device px at DPR 2. A 512
  map is already a 2.4x oversample. 1024 exists only as headroom for close
  framing later.
- Prefer a single combined atlas per character over several maps.
- Use KTX2/basis only if you also wire up a transcoder; plain PNG/JPEG inside
  the GLB is expected.

---

## 4. Orientation, scale, and origin

These exist so models drop in without per-asset fudge factors. A model that
follows them needs no correction code at all.

- **Up axis: +Y.** glTF's own convention; do not bake a Z-up rotation in.
- **Facing: +Z**, toward the camera. The camera sits at `[0, 0, 5]` looking at
  the origin, so a character authored facing +Z faces the viewer with no
  rotation applied.
- **Origin: at the feet**, centred on the X/Z footprint. Not the hips, not the
  mesh centroid. The character is placed by its base, so a foot-origin lets the
  ground line stay put when scale changes between stages.
- **Height: exactly 1.0 world unit** from origin to the top of the head, in the
  neutral idle pose, at scale 1.

The height rule is the important one, and it is what makes the stage scales in
`character.ts` meaningful. The camera frames a visible world box of
**1.58 wide × 3.15 tall** (fov 35 at distance 5 — the derivation is in the
comment at the top of
[CharacterCanvas.tsx](src/components/world/CharacterCanvas.tsx)). With a
1.0-unit-tall character, the stage ladder runs 0.70 at `start` to 1.45 at
`elite`, so the character occupies 22% to 46% of frame height. Authoring to a
different height silently rescales the whole ladder.

- Apply no transform on the root node. Bake it into the geometry.
- Units are metres in glTF terms, but treat "1 unit = character height" as the
  contract here.

---

## 5. Variants

**Decision: a variant is a material swap on one shared GLB, not a separate
file.**

`character_variant` names a colourway that is applied at runtime by overriding
the base-colour factor on the loaded model's materials. `characterId` picks the
geometry; `characterVariant` picks the palette.

Reasons:

- One download per creature regardless of how many colourways exist, and the
  model is cached across variant changes.
- Adding a colourway costs a palette entry, not an asset, a build step, and a
  review.
- The DB already stores the two independently
  (`habits.character_id`, `habits.character_variant`, both nullable TEXT), so
  this needs no schema change.

Consequences the asset author must honour:

- Name the swappable material **`Body`** exactly. That is the material phase 2
  will override. Anything not intended to recolour (eyes, mouth) must use a
  different material name.
- Author the `Body` material with a **white/neutral base-colour factor** and put
  the shading in the texture's luminance, so multiplying by a palette colour
  produces the intended result rather than a muddy one.
- Keep the palette list in code, not in the assets.

If a future creature genuinely needs different geometry per variant, that is a
separate `characterId`, not a variant.

---

## 6. Animation clips

Every character GLB must contain **all six** of these clips, named exactly.
The list is `REQUIRED_CLIPS` in `character.ts`; `clipForStage()` maps a display
state to a clip name.

| Clip | Plays when | Intent |
|---|---|---|
| `idle_start` | streak 0 | small, tentative, low energy |
| `idle_building` | streak 1–3 | waking up, small movements |
| `idle_committed` | streak 4–7 | settled, steady |
| `idle_strong` | streak 8–20 | confident, more amplitude |
| `idle_elite` | streak 21+ | expansive, most alive |
| `idle_recovery` | any streak, after a missed day | subdued, gentle |

Note `idle_recovery` is a **clip of its own, not a modifier**. `recovery` is not
a rung on the growth ladder — it is an orthogonal mood that overrides whatever
growth stage is current (see the header comment in `character.ts`). The visual
treatment composes (a recovering veteran stays bigger than a recovering
beginner), but the clip simply switches.

Clip requirements:

- **Seamless loops.** First and last keyframe must match. There is no
  transition logic in phase 1; phase 2 will cross-fade, but a clip that pops on
  its own loop will still pop.
- **2–5 seconds** each. Long enough not to read as a twitch, short enough to
  keep the file small.
- **30fps** keyframes. Do not bake at 60.
- Root motion: **none.** The character must not translate. Stage changes move
  it via scale only.
- Keep the skeleton **under 40 bones**. Skinning cost scales with bones ×
  vertices, and this is the one cost the triangle benchmark above does not
  cover.
- All six clips must share **one skeleton**, so switching does not rebind.

---

## 7. Acceptance checklist

A character is ready when:

- [ ] `public/characters/<id>.glb` exists, `<id>` is lowercase kebab
- [ ] ≤ 15,000 triangles (target 8,000)
- [ ] ≤ 3 MB (target 1.5 MB)
- [ ] textures embedded, ≤ 1024², ideally one atlas
- [ ] +Y up, faces +Z, origin at the feet, exactly 1.0 units tall at scale 1
- [ ] no transform on the root node
- [ ] swappable material is named `Body`, neutral base-colour factor
- [ ] all six `idle_*` clips present, exact names, seamless, 2–5s, 30fps
- [ ] no root motion, one shared skeleton, < 40 bones
- [ ] loads with plain `GLTFLoader`, no extensions beyond glTF core PBR

---

## 8. Explicitly out of scope for phase 2

Recorded so it does not get scope-crept in:

- Draco / meshopt compression
- KTX2 texture compression
- LODs — the character is 106 px wide at most
- Shadows, environment maps, post-processing
- Per-variant geometry
- Facial morph targets / blendshapes
