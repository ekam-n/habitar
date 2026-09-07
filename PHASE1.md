# Phase 1 — A Working 3D Canvas

A WebGL canvas renders in the card's `z-10` slot, sized correctly, with loading
and error behaviour, driven by streak stage. It renders a **placeholder
capsule**, not a character. Real GLBs are phase 2, specified in
[ASSETS.md](ASSETS.md).

Five commits, one per task, `7d80dc9..84a2dcc`. `npm run build` passes after
each. No `.glb` files, no `useGLTF`/`GLTFLoader` — both verified absent.

Everything below was measured in headless Chrome (WebGL2) against a
**production** build. Where something was checked rather than reasoned about,
the numbers are given.

---

## Camera and sizing setup

The full derivation lives in the header comment of
[src/components/world/CharacterCanvas.tsx](src/components/world/CharacterCanvas.tsx).
Summary:

**The container's aspect ratio is a constant 0.5.** `w-1/3` and `h-2/3` are
fractions of the *same square card*, so the canvas scales uniformly and never
changes shape. This is the property everything else rests on.

A perspective camera's visible world extent depends only on fov, distance and
aspect — never on pixel size:

```
visibleHeight = 2 * distance * tan(fov / 2)
visibleWidth  = visibleHeight * aspect
```

With aspect pinned, the visible world box is identical at 448px and at 224px.
The same content maps to fewer pixels, so the character scales in exact lockstep
with the background. **No drift, and no viewport-dependent fudge factors were
needed.**

- **fov 35, camera at `[0, 0, 5]`**, giving a visible frame of **1.58 × 3.15
  world units**. fov is narrow deliberately: a long lens flattens perspective
  distortion, which matters when filling a tall thin frame with a small subject.
- **`dpr={[1, 2]}`** — verified to cap: at `devicePixelRatio: 3` the buffer
  stays at 2× (298×597 for a 149.3×298.7 box).

Measured across six viewport widths, driving the card from 448px to 224px:

| viewport | card | canvas css | aspect | char/canvasW | char/canvasH |
|---|---|---|---|---|---|
| 900 | 448 | 149.3×298.7 | 0.4998 | 0.4956 | 0.5223 |
| 640 | 448 | 149.3×298.7 | 0.4998 | 0.4956 | 0.5223 |
| 480 | 384 | 128×256 | 0.5000 | 0.4922 | 0.5156 |
| 400 | 304 | 101.3×202.7 | 0.4998 | 0.4936 | 0.5229 |
| 360 | 264 | 88×176 | 0.5000 | 0.5114 | 0.5227 |
| 320 | 224 | 74.7×149.3 | 0.5003 | 0.5087 | 0.5157 |

Apparent-size spread is **3.8% on width, 1.4% on height**, and that residue is
pixel quantisation: at a 74.7px canvas the character is 38px, so one antialiased
edge pixel is already 2.6%.

Also confirmed rather than assumed:

- R3F's ResizeObserver works **inside this specific container** — the drawing
  buffer tracks the CSS box at every width.
- The canvas paints **0 pixels outside its slot**, and the card's `rounded-3xl`
  corners stay clipped. Note the slot spans x 149..299 of 448 while the corner
  radius is 24px, so corner bleed is *structurally impossible* here, not merely
  absent.

**Nothing fought back on task 2.** One measurement trap worth knowing: the z-20
title gradient occludes the character's lower body, so *visible* extent diverges
from *rendered* extent as the card shrinks (the gradient is text-sized and does
not scale). Measure with the chrome hidden — an early run showed a bogus 8.67pp
"drift" that was entirely this.

---

## What the error boundary catches

Three findings here came from testing, and two of them contradicted the obvious
design.

**1. A React error boundary does NOT catch WebGL being unavailable.**
three.js throws `Error creating WebGL context` from R3F's renderer setup, which
runs in an *effect*, not the render phase, so `getDerivedStateFromError` never
fires. Observed: the page survived, but produced **two uncaught errors and no
message for the user**. Fixed with an explicit up-front WebGL capability probe.

**2. A boundary placed only *outside* `<Canvas>` does not catch scene-graph
throws.** R3F renders Canvas children into its own reconciler root, so a
DOM-side boundary cannot see them. Observed: a scene throw **unmounted the
entire card**. Fixed by placing a second boundary *inside* the Canvas; error
boundaries are a reconciler-level feature, so a class component works there and
simply returns `null`.

**3. Context loss does not throw** — it fires `webglcontextlost`. Handled with a
listener registered in `onCreated`.

So the current layering is:

| Failure | Mechanism | Result |
|---|---|---|
| WebGL unavailable | up-front probe | renders nothing, error banner |
| Scene-graph throw | boundary *inside* Canvas | scene empties, card intact, error banner |
| `<Canvas>` construction throw | boundary *outside* Canvas | slot empties, error banner |
| Context lost after mount | `webglcontextlost` listener | error banner |

All degrade to **background alone plus a message**, never a crash. Verified with
WebGL stubbed out: no canvas, card and background intact, alert shown, **zero
uncaught errors** (was two). A render-phase scene throw was verified with a
temporary throwing child, since removed — no test hooks remain.

React 19 still re-reports boundary-caught errors to `window.onerror`, so seeing
one in the console does not mean the boundary failed.

**Suspense** wraps the scene contents with a low-segment translucent capsule.
Nothing suspends yet; layout shift is impossible because the slot is CSS-sized,
so no 3D content can affect page layout.

### `notice` vs `error`

PHASE0.md warned the single message slot was already overloaded. It is now
split, before the 3D layer added a third class:

- **`notice`** — `role="status"`, soft accent. Benign: "Already logged today".
- **`error`** — `role="alert"`, red border. Something failed: generation,
  network, WebGL.

Canvas failures route into `error` via `onCharacterError`, threaded
`page.tsx → HabitWorldCard → CharacterCanvas`.

---

## What the stage mapping does

[src/lib/rules/character.ts](src/lib/rules/character.ts). `GROWTH_STAGES` and
the thresholds are **imported from `titles.ts`, never redefined** —
`growthStageForStreak` delegates to `getStreakState(streak, false)` rather than
repeating the boundaries, because duplicated thresholds are the exact
contradiction phase 0 removed.

| Stage | Scale | Colour | Vitality |
|---|---|---|---|
| `start` | 0.70 | `#d9c9b2` | 0.10 |
| `building` | 0.87 | `#d2a878` | 0.32 |
| `committed` | 1.04 | `#c98f56` | 0.54 |
| `strong` | 1.24 | `#c17f4a` | 0.78 |
| `elite` | 1.45 | `#b4652a` | 1.00 |

`recovery` is **not a sixth rung.** It composes over whatever growth stage is
current: `scale × 0.88`, colour to a cool grey `#8d8c93`, vitality 0.16. So a
recovering veteran stays visibly bigger than a recovering beginner. Top of the
ladder is 1.45×, not 3×, so `elite` still fits the 1.58 × 3.15 frame.

Transitions **ease rather than snap**, using a framerate-independent
`1 - exp(-rate * dt)` convergence — a plain `lerp(a, b, 0.1)` would move faster
on a 120Hz display than a 60Hz one. Delta is clamped so a backgrounded tab does
not jump on return.

Verified by sweeping streak 0→22 and measuring the rendered character:

| streak | stage | height | mean RGB | |
|---|---|---|---|---|
| 0 | start | 108 | rgb(173,161,144) | |
| 1 | building | 136 | rgb(174,139,96) | **changed** |
| 4 | committed | 162 | rgb(176,124,70) | **changed** |
| 8 | strong | 192 | rgb(178,117,64) | **changed** |
| 21 | elite | 226 | rgb(177,104,48) | **changed** |

**Every other streak in 0..22 was byte-identical to its predecessor**
(dH=0, dRGB=0) — so it changes at 1/4/8/21 and nowhere else, matching the phase
0 ladder exactly. `recovery` at streak 9 renders height 170, rgb(119,112,115)
against `strong`'s 192, rgb(178,117,64) — a colour distance of **115**, clearly
distinct. Easing confirmed by sampling the transition: 80 → 221 → 249 → 260 →
263 px, asymptotic.

The database was restored to its 12/12/63 baseline after the sweep.

---

## Bundle impact

| | raw | gzip |
|---|---|---|
| Before | 0.60 MB | 0.18 MB |
| After | 1.45 MB | 0.40 MB |
| **Delta** | **+0.85 MB** | **+0.22 MB** |

All of it lands in one new chunk (874 KB raw / 231 KB gzip — that is three).
For proportion, a single AI background PNG averages 990 KB, so three costs less
over the wire than one background image.

`@react-three/drei` is installed but **unused this phase** — it is staged for
phase 2's `useGLTF`/`useAnimations` and tree-shakes out for now.

`npm audit` reports 12 vulnerabilities. **None come from three/R3F/drei** —
they are all pre-existing transitive deps of Next, sharp, tar and the eslint
tooling. Not acted on.

---

## What phase 2 needs

The full contract is [ASSETS.md](ASSETS.md). What plugs in where:

- **Replace `PlaceholderCharacter`** in `CharacterCanvas.tsx`. It already
  receives `stage` and `streak` and already resolves a treatment; swap the
  capsule for a loaded GLB and the scale/colour payload for model + clip
  selection. The easing loop can stay.
- **`character.ts` already has the types**: `CharacterId`, `CharacterVariant`,
  `REQUIRED_CLIPS`, `clipForStage()`, `modelPath()`.
- **`characterId` / `characterVariant` are still unconsumed plumbing.** They
  flow `page.tsx → HabitWorldCard → (not yet into the canvas)`. Phase 2 threads
  them the last hop.
- **Suspense is already in place** for `useGLTF` to suspend against, and the
  inner boundary will catch a model that fails to load and rethrows.
- **Key facts for the asset author**: the camera frames **1.58 × 3.15 world
  units**; a character must be **exactly 1.0 units tall, origin at the feet,
  +Y up, facing +Z**. Budgets: **8,000 triangles target / 15,000 cap**,
  **1.5 MB target / 3 MB cap**. All derived from measurement — see ASSETS.md §3.

### Still missing, deliberately

- **No write path for appearance.** `setHabitAppearance` exists (phase 0) but
  no route calls it. The AvatarPicker onboarding step is still unbuilt, so
  `characterId` is always null in practice.
- **No shadow or ground contact.** The character floats against the background
  with no anchoring cue. Fine for a capsule; likely to read as wrong for a
  character.
- **The `strong` band is 13 streaks wide** (8–20) — by far the longest stretch
  with no visual change. Not a bug, but worth a product decision before real
  assets make it more noticeable.

### One footgun, carried over from phase 0

Deleting a route leaves a stale validator in `.next/dev/types/` that breaks
`next build` until you `rm -rf .next/dev`, because `tsconfig.json` includes
`.next/dev/types/**/*.ts`.
