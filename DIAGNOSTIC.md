# Habitar / "Habit World" — Current-State Diagnostic

Read-only survey of the repo at commit `fbbdc31` (branch `main`, clean tree). No files
were modified; no build, install, or migration commands were run. The SQLite database was
opened in `readonly` mode purely to confirm the live schema and row contents.

---

## Summary

This is a small Next.js 16 / React 19 app (~900 lines of first-party TypeScript across 17
source files) that turns a free-text habit description into a keyword-matched "profile,"
generates one AI background image for it via a local ComfyUI instance, and then shows that
image with a streak counter and an evolving text title. It is a single-habit app: the
active habit id lives in `localStorage`, and there is no auth, no user table, and no
multi-habit UI.

**The most important finding for your planned change: there is no avatar in this codebase
today.** The briefing describes "a cute avatar and environment that visually grow as the
user's streak increases," but the avatar was deleted in commit `c70dbc1` ("removed avatar,
accessory, and changed habitar to habit world"), which removed `src/components/Avatar.tsx`
(546 lines) and `src/components/AvatarPicker.tsx` (97 lines). Nothing renders a character
now — the world card is a single `<img>` plus two absolutely-positioned text overlays.

The second finding is that **the environment does not grow either**. Commit `2a7bdd8`
("removed img gen at each milestone") stripped image regeneration out of the log endpoint.
Today exactly one background is generated, at habit creation, and it is reused forever.
I confirmed this in the live database: habit 18 has generations at streaks 0, 1, 3 and 7,
all four pointing at the same `bg_image_path`. So the "streak drives visuals" mechanic is
currently inert — streak drives a *text title* and a number, nothing pictorial.

Health is otherwise reasonable for a personal project: the layering is clean
(rules → db → api → client), there is no state-management library to fight, and the render
path is short. But there is a decent amount of orphaned scaffolding left over from the
avatar era — a dead DB helper that references a column that does not exist, a dead
`@keyframes` block, a dev toggle that is wired to nothing, and a `test.ts` that imports a
function that was deleted. There are also no automated tests, no CI, and no error handling
anywhere in the fetch/generate path.

The upside for your migration: because the avatar was already surgically removed, the slot
you would drop a GLB into is currently *empty and clean*. That is a much better starting
position than an entangled one.

---

## Stack and how to run it

| Concern | What it is | Evidence |
|---|---|---|
| Framework | Next.js `16.2.1`, App Router | [package.json:12](package.json#L12), [src/app/](src/app/) |
| React | `19.2.4` | [package.json:13-14](package.json#L13-L14) |
| Language | TypeScript 5, `strict: true` | [tsconfig.json:7](tsconfig.json#L7) |
| Styling | Tailwind CSS v4 via PostCSS, plus CSS custom properties | [postcss.config.mjs](postcss.config.mjs), [src/app/globals.css:1-10](src/app/globals.css#L1-L10) |
| Package manager | npm (only `package-lock.json` present) | [package-lock.json](package-lock.json) |
| Persistence | SQLite via `better-sqlite3` (synchronous), WAL mode | [src/lib/db/schema.ts:1-15](src/lib/db/schema.ts#L1-L15) |
| Bundler | Turbopack (dev artifacts under `.next/dev/`) | build output on disk |
| 3D / animation libs | **none** — no three.js, no R3F, no Lottie, no framer-motion | [package.json:10-16](package.json#L10-L16) |

### Commands

```
npm install      # not run by me
npm run dev      # next dev  -> http://localhost:3000
npm run build    # next build
npm start        # next start
npm run lint     # eslint
```

Or double-click [start.bat](start.bat), which does `npm install`, opens
`http://localhost:3000`, then `npm run dev` ([start.bat:1-6](start.bat#L1-L6)).

### Entry points

- Root layout: [src/app/layout.tsx](src/app/layout.tsx) — loads Google Fonts (Fraunces, DM Sans) via `<link>` in `<head>`, not `next/font`.
- Single page: [src/app/page.tsx](src/app/page.tsx) — `"use client"`, a two-step state machine (`"form" | "world"`).
- API routes: [src/app/api/generate/](src/app/api/generate/), [log/](src/app/api/log/), [habit/](src/app/api/habit/), [reset/](src/app/api/reset/), [dev/seed/](src/app/api/dev/seed/), [dev/reset/](src/app/api/dev/reset/).

### Env vars

Both live in [.env.local](.env.local) (gitignored at [.gitignore:33](.gitignore#L33)):

- `COMFY_URL=http://127.0.0.1:8000`
- `NEXT_PUBLIC_DEV_MODE=false`

**Discrepancy worth flagging:** the code default is port **8188**
([src/lib/ai/comfy.ts:4](src/lib/ai/comfy.ts#L4)), the committed `.env.local` and the
README both say **8000** ([README.md:12](README.md#L12)). ComfyUI's own stock default is
8188. So the fallback and the configured value disagree; whichever is right, one of the
two is misleading.

### Backend / frontend split

There is no separate backend. Everything is one Next.js process: route handlers under
`src/app/api/` run server-side and talk to SQLite and to ComfyUI directly; the single page
is a client component that talks to those routes with `fetch`. The DB file
[habitar.db](habitar.db) sits at the repo root (`process.cwd()`,
[src/lib/db/schema.ts:4](src/lib/db/schema.ts#L4)) and is gitignored
([.gitignore:44-46](.gitignore#L44-L46)). Tables are created lazily on first `getDb()` call
via `CREATE TABLE IF NOT EXISTS` ([src/lib/db/schema.ts:17-49](src/lib/db/schema.ts#L17-L49)) —
there is no migration system, which matters below.

---

## Avatar system

**There is no avatar system in the current tree.** This is a direct contradiction of the
briefing, so I want to be precise about what I checked and what I found.

### What renders inside the "world" today — file by file

**1. [src/app/page.tsx](src/app/page.tsx)** — owns all state, renders one of two children.

- `WorldState` interface ([lines 8-15](src/app/page.tsx#L8-L15)): `habitId`, `title`, `buttonLabel`, `bgImagePath`, `streak`, `missedYesterday`. **No avatar field of any kind.**
- Renders `<HabitWorldCard>` with nine props ([lines 168-180](src/app/page.tsx#L168-L180)) — none avatar-related.

**2. [src/components/HabitWorldCard.tsx](src/components/HabitWorldCard.tsx)** — the entire visual world. 112 lines. Structure:

- [line 27](src/components/HabitWorldCard.tsx#L27): the stage — `relative rounded-3xl overflow-hidden shadow-2xl aspect-square`. A square, clipped container. This is the only sizing contract in the app.
- [lines 30-34](src/components/HabitWorldCard.tsx#L30-L34): the background — a plain `<img src={bgImagePath}>` with `w-full h-full object-cover`. Not `next/image`. No `z-index` (so it sits at the base of the stacking context).
- [lines 37-47](src/components/HabitWorldCard.tsx#L37-L47): streak chip, `absolute top-4 left-4 z-20`.
- [lines 50-57](src/components/HabitWorldCard.tsx#L50-L57): title overlay, `absolute bottom-0 ... z-20`, gradient scrim.
- [lines 61-109](src/components/HabitWorldCard.tsx#L61-L109): recovery message and three buttons, all *outside* the square stage.

That is the whole render. Two layers: image at base, chrome at `z-20`. **`z-10` is
conspicuously unoccupied** — that is exactly where the avatar used to live (see below).

**3. [src/components/HabitForm.tsx](src/components/HabitForm.tsx)** — onboarding textarea. No avatar.

**4. [src/app/globals.css:27-30](src/app/globals.css#L27-L30)** — the only animation code in
the repo:

```css
@keyframes habit-world-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-12px); }
}
```

**This keyframe is referenced by nothing.** I grepped the whole of `src/` for
`habit-world-float` and the only hit is its own definition. It is a leftover: it was named
`habitar-float` and was consumed by the deleted avatar, and commit `c70dbc1` renamed it
(`globals.css | 2 +-`) without deleting it or its now-absent consumer.

### What the avatar *was* (from git history — for context only)

Recovered from `git show 574a3c5:src/components/Avatar.tsx`, the last commit that had it.
These paths **do not exist on disk**; I cite them so you can judge what you would be
replacing.

- **Hand-authored inline SVG**, 545 lines, `viewBox="0 0 180 375"`, `width/height: 100%`.
- **It was already rigged in 2D.** The component took a `PoseProps` interface of 14 joint
  rotation angles — `headRot`, `torsoRot`, `leftUpperArmRot`, `leftLowerArmRot`,
  `leftHandRot`, and mirrored right/leg equivalents — each applied as an SVG
  `rotate(angle cx cy)` transform on a `<g>`. So the mental model of a skeleton with named
  joints already existed here; it maps conceptually onto a GLB armature.
- **Parameterization was by user choice, not by streak**: `bodyType: "A" | "B"` (short hair
  vs. long hair) and `skinTone` (5 options: light, lightMedium, medium, mediumDark, dark).
  These were picked once during onboarding by `AvatarPicker.tsx` and held in React state
  (`avatarConfig`) — they were **never persisted to the database** and were lost on reload.
- **Animation**: a single `animate?: boolean` prop that toggled
  `animation: "habitar-float 3s ease-in-out infinite"` on a wrapping `<div>`. The card
  passed `animate={true}` unconditionally. So the only "animation" that ever shipped was a
  3-second CSS bob of the whole SVG. The 14 pose angles were **never driven by anything** —
  all defaulted to `0` and no caller passed them. It was a rig with no animator attached.
- **Composition**: `<div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-1/3 h-2/3">`
  — bottom-center, one third the card's width, two thirds its height, at `z-10` between the
  background and the chrome.

### Dead avatar code still on disk

- **[src/lib/db/actions.ts:116-118](src/lib/db/actions.ts#L116-L118)** — `updateHabitAvatar()`
  runs `UPDATE habits SET avatar_image_path = ?`. I queried the live database: the `habits`
  table has columns `id, raw_input, domain, tone, setting, reward_style, button_label,
  created_at` — **there is no `avatar_image_path` column**, and none is declared in
  [schema.ts:19-28](src/lib/db/schema.ts#L19-L28). This function is exported, called from
  nowhere, and would throw `SqliteError: no such column` if it ever were called.
- **[src/lib/db/schema.ts:44,46](src/lib/db/schema.ts#L44-L46)** — the `generations` table
  still declares `accessory_prompt` and `accessory_image_path`. Confirmed present in the
  live DB. Nothing reads or writes them; `saveGeneration()`
  ([actions.ts:82-92](src/lib/db/actions.ts#L82-L92)) inserts only five columns.
- **[public/generated/](public/generated/)** — 21 files named `acc_*.png` (accessory
  renders) and 2 named `avatar_*.png`, orphaned output from the deleted feature.

---

## Streak → visuals mapping

### Where streak lives

Single source of truth is the `streaks` table, one row per habit
([schema.ts:30-36](src/lib/db/schema.ts#L30-L36)): `streak_count`, `last_logged_date`,
`missed_yesterday`. All mutation goes through
[`logHabit()` in src/lib/db/actions.ts:49-72](src/lib/db/actions.ts#L49-L72).

### The exact code path, click to pixel

```
[click "Log Workout"]
  page.tsx:112 handleLog()
    -> POST /api/log  { habitId, force: true }            page.tsx:116-124
       log/route.ts:15   logHabit(habitId, force)
         actions.ts:60-63  compute newStreak / missedYesterday
         actions.ts:65-69  UPDATE streaks
       log/route.ts:24   if (!TITLE_MILESTONES.has(streak) && !missedYesterday) -> early return
       log/route.ts:43   title = generateTitle(profile, streak, missedYesterday)
         titles.ts:79      state = getStreakState(streak, missedYesterday)
         titles.ts:80-81   pick a RANDOM string from titleTemplates[domain][state]
       log/route.ts:44   saveGeneration(... bgImagePath: latest.bg_image_path)  <-- unchanged path
       log/route.ts:46-51 respond { streak, missedYesterday, title, bgImagePath }
  page.tsx:129-135  setWorld({ ...prev, title, bgImagePath, streak, missedYesterday })
    -> HabitWorldCard re-renders
       line 42: {streak}          the number changes
       line 55: {title}           the words change
       line 31: src={bgImagePath} the SAME url as before -> no visual change
```

### Stages: discrete, six of them, and the thresholds are inconsistent

`getStreakState()` ([titles.ts:5-12](src/lib/rules/titles.ts#L5-L12)) is the only
streak→appearance function in the codebase:

| State | Condition |
|---|---|
| `recovery` | `missedYesterday` (checked first, overrides all) |
| `start` | `streak === 0` |
| `building` | `streak < 4` |
| `committed` | `streak < 8` |
| `strong` | `streak < 21` |
| `elite` | otherwise (21+) |

**These thresholds do not line up with the milestones that trigger a refresh.**
[log/route.ts:6](src/app/api/log/route.ts#L6) defines `TITLE_MILESTONES = {1, 3, 7, 14, 30}`,
but the state boundaries are at **1, 4, 8, 21**. Consequences, tracing the two sets against
each other:

- streak 1 → milestone fires, state genuinely becomes `building`. ✅ the only aligned one.
- streak 3 → milestone fires, but state is *still* `building`. The user gets a different
  random string from the same bucket — reads as a glitch, not progress.
- streak 4 → state becomes `committed`, but 4 is not a milestone, so **no refresh happens**.
  The user sits on a `building` title while the state says `committed`.
- streak 7 → milestone fires, catches up to `committed` three days late.
- streak 8 → becomes `strong`, no milestone, no refresh.
- streak 14 → milestone fires, catches up to `strong`.
- streak 21 → becomes `elite`, **no milestone**, no refresh.
- streak 30 → milestone fires, finally shows an `elite` title, nine days late.

So four of the five milestones are misaligned with the state machine they are gating.
This is observation, not inference — both constants are literal.

### Every place that reads streak to drive visuals

Exhaustive; there are five, and only two are user-visible:

1. [HabitWorldCard.tsx:42](src/components/HabitWorldCard.tsx#L42) — renders `{streak}` as a number.
2. [titles.ts:5-12](src/lib/rules/titles.ts#L5-L12) `getStreakState()` → the title string.
3. [prompts.ts:29-32](src/lib/rules/prompts.ts#L29-L32) `generateBackgroundPrompt()` — maps state to `progressDescriptors` ([prompts.ts:13-20](src/lib/rules/prompts.ts#L13-L20), e.g. `elite: "dramatic, glowing, epic atmosphere, legendary"`). **Currently only ever called with `streak = 0`** ([generate/route.ts:18](src/app/api/generate/route.ts#L18)), so only the `start` descriptor `"simple, clean, early morning light, minimal"` is ever used in practice. The other five descriptors are written but unreachable.
4. [imageService.ts:4](src/lib/ai/imageService.ts#L4) — puts streak in the output filename. Also always `0` now, which is why nearly every file in `public/generated/` is named `bg_<id>_0_*`.
5. [log/route.ts:24](src/app/api/log/route.ts#L24) — the milestone gate.

### Two streak bugs the UI actively triggers

- **`force: true` is sent unconditionally**, not just in dev mode
  ([page.tsx:121](src/app/page.tsx#L121)). Inside `logHabit`, `force` short-circuits both the
  "already logged today" guard ([actions.ts:56](src/lib/db/actions.ts#L56)) and the
  consecutive-day check ([actions.ts:61](src/lib/db/actions.ts#L61)), and forces
  `missedYesterday = 0` ([actions.ts:63](src/lib/db/actions.ts#L63)). Net effect: the log
  button increments the streak every click, date logic is entirely bypassed, and the
  `recovery` state is **unreachable through the UI**. The "Welcome back — every restart
  counts 🌱" banner ([HabitWorldCard.tsx:61-65](src/components/HabitWorldCard.tsx#L61-L65))
  can therefore never display. The real streak logic exists and looks correct; nothing calls
  it in its intended mode.
- **`getLatestGeneration()` orders by `created_at DESC`**
  ([actions.ts:97-99](src/lib/db/actions.ts#L97-L99)), and `created_at` is
  `datetime('now')` — **one-second resolution**
  ([schema.ts:47](src/lib/db/schema.ts#L47)). With `force: true` a user can easily log twice
  in one second. I found two real collisions in the live DB (habit 4 and habit 11 each have
  two generations sharing a timestamp), where the returned "latest" row is arbitrary.
  Symptom: the title can jump backwards to an older one. `ORDER BY id DESC` would be
  deterministic; I am not changing it.

---

## ComfyUI integration

**Runtime, server-side, once per habit, synchronously blocking the HTTP response.** Not a
build step.

### The wiring

[src/lib/ai/comfy.ts](src/lib/ai/comfy.ts) is the whole client — 91 lines, no SDK, plain
`fetch` against ComfyUI's HTTP API:

1. [comfy.ts:12-16](src/lib/ai/comfy.ts#L12-L16) `loadWorkflow()` — reads
   [src/lib/ai/workflow.json](src/lib/ai/workflow.json) from disk with `fs.readFileSync`,
   **on every call** (no caching). It resolves the path as
   `path.join(process.cwd(), "src/lib/ai/workflow.json")` — a hardcoded *source* path, so
   this only works when the source tree is present at runtime.
2. [comfy.ts:69-70](src/lib/ai/comfy.ts#L69-L70) locates the prompt node by `_meta.title`,
   trying `"Positive Prompt"` then falling back to `"CLIP Text Encode (Prompt)"`.
3. [comfy.ts:77](src/lib/ai/comfy.ts#L77) injects the prompt text; [80-84](src/lib/ai/comfy.ts#L80-L84) randomizes the `KSampler` seed.
4. [comfy.ts:26-32](src/lib/ai/comfy.ts#L26-L32) `POST {COMFY_URL}/prompt`.
5. [comfy.ts:35-55](src/lib/ai/comfy.ts#L35-L55) polls `GET {COMFY_URL}/history/{id}` every 1500 ms, 60 s timeout, then throws.
6. [comfy.ts:57-63](src/lib/ai/comfy.ts#L57-L63) `GET {COMFY_URL}/view?filename=...`, writes the bytes to `public/generated/<name>` with `fs.writeFileSync`, returns the public URL `/generated/<name>`.

### Where it is called from

Exactly one place:
[generate/route.ts:22](src/app/api/generate/route.ts#L22) → `generateBackgroundImage()`
([imageService.ts:3-6](src/lib/ai/imageService.ts#L3-L6)) → `generateImage()`. That is the
habit-creation path only. **No other caller exists.** The log endpoint imports neither
module since `2a7bdd8`.

### The workflow

[workflow.json](src/lib/ai/workflow.json) is a 7-node API-format graph: `CheckpointLoaderSimple`
→ 2× `CLIPTextEncode` → `KSampler` → `VAEDecode` → `SaveImage`, at 1024×1024
([workflow.json:41-51](src/lib/ai/workflow.json#L41-L51)).

**Surprising config:** the checkpoint is `sdxl_lightning_4step.safetensors`
([workflow.json:34](src/lib/ai/workflow.json#L34)) — a 4-step distilled model — but the
KSampler is set to `steps: 25, cfg: 7, sampler: dpmpp_2m, scheduler: karras`
([workflow.json:5-8](src/lib/ai/workflow.json#L5-L8)). Lightning checkpoints normally want
~4 steps and cfg ~1–2. Running a 4-step model at 25 steps / cfg 7 is roughly 6× slower than
needed and typically produces over-saturated, over-cooked output. I'm flagging the mismatch,
not asserting what the images actually look like.

Also note node 6's default `text` is still the ComfyUI sample prompt
`"beautiful scenery nature glass bottle landscape, , purple galaxy bottle,"`
([workflow.json:54](src/lib/ai/workflow.json#L54)) — harmless, since it is always
overwritten at [comfy.ts:77](src/lib/ai/comfy.ts#L77), but it means a title-matching failure
would silently render bottles rather than error.

### Assets: where they go, how the frontend finds them

- Written to `public/generated/` ([comfy.ts:5](src/lib/ai/comfy.ts#L5)), created at **module
  load time** via a top-level `fs.mkdirSync` side effect
  ([comfy.ts:8-10](src/lib/ai/comfy.ts#L8-L10)) — this runs on import, not on call.
- Filenames: `bg_{habitId}_{streak}_{Date.now()}.png` ([imageService.ts:4](src/lib/ai/imageService.ts#L4)).
- The path string is persisted to `generations.bg_image_path` and handed to the client in the
  JSON response; the client stores it in React state and drops it into `<img src>`. The
  frontend never scans a directory — the DB is the index.
- The directory currently holds **71 PNGs** and is gitignored
  ([.gitignore:49](.gitignore#L49)), so a fresh clone starts empty.
- **Loading is fully browser-native and unmanaged**: a bare `<img>`, no preload, no
  `next/image`, no cache layer, no loading or error state, no `onError` fallback. If the
  file is missing you get a broken-image icon. Static serving is just Next's `public/`.

### No error handling anywhere in this path

`generateImage` can throw (timeout at [comfy.ts:54](src/lib/ai/comfy.ts#L54), missing node
at [comfy.ts:73](src/lib/ai/comfy.ts#L73), or `fetch` ECONNREFUSED if ComfyUI is down), and
[generate/route.ts](src/app/api/generate/route.ts) has no `try`/`catch`. The client's
`handleCreate` ([page.tsx:88-110](src/app/page.tsx#L88-L110)) does `await res.json()` without
checking `res.ok`, so a 500 becomes an unhandled parse of an error object and the user is
left on the form with the spinner cleared. Symptom if ComfyUI isn't running: pressing
"Start My Habit" appears to do nothing after a moment. Note also that the habit row is
written **before** generation ([generate/route.ts:20-22](src/app/api/generate/route.ts#L20-L22)),
so a failure leaves an orphaned habit with no generation row.

---

## Environment / background rendering

- **Compositing model**: one absolutely-positioned stacking context. The stage
  ([HabitWorldCard.tsx:27](src/components/HabitWorldCard.tsx#L27)) is
  `relative … aspect-square … overflow-hidden` with a `--cream-dark` fallback background.
  The image is an in-flow `w-full h-full object-cover` child; the chrome is `absolute … z-20`.
- **Sizing assumptions**: the card is square and driven by `w-full max-w-md`
  ([HabitWorldCard.tsx:20](src/components/HabitWorldCard.tsx#L20)) — so **max 448 px wide,
  square, fluid below that**. `object-cover` means the 1024×1024 source is displayed 1:1
  aspect with no cropping in practice. `overflow-hidden` + `rounded-3xl` clips children.
- **Z-order in use**: background (implicit 0) → *(z-10 vacant)* → chrome (z-20). The
  vacant middle layer is where the avatar sat.
- **Animation libraries: none.** No Lottie, no framer-motion, no GSAP, no three.js —
  confirmed against [package.json:10-23](package.json#L10-L23). The single orphaned
  `@keyframes` at [globals.css:27-30](src/app/globals.css#L27-L30) is the entire animation
  surface, and it is unreferenced.
- **Relevant to your change**: the background prompt's style instruction is
  `"flat vector illustration style, clean lines, soft color palette, no text, no characters, no faces"`
  ([prompts.ts:22](src/lib/rules/prompts.ts#L22)). The backgrounds are *deliberately*
  character-free flat vector art. That is a favorable property for compositing a character
  on top, but it is also a strong 2D flat-illustration look that a lit 3D GLB may sit
  awkwardly against — a visual-direction question, not a code one.

---

## State management

There is no state library and no server-state library. It is `useState` in one component.

- **All state lives in [src/app/page.tsx](src/app/page.tsx)** as five `useState` hooks
  ([lines 27-31](src/app/page.tsx#L27-L31)): `step`, `world`, `loading`, `logging`,
  `devGeneration`. No Context, no Redux/Zustand/Jotai, no React Query/SWR.
- **Flow is strictly one-way props**: `page.tsx` → `HabitWorldCard` / `HabitForm`. Children
  are pure presentational components that receive values and callbacks
  ([HabitWorldCard.tsx:3-13](src/components/HabitWorldCard.tsx#L3-L13),
  [HabitForm.tsx:4-7](src/components/HabitForm.tsx#L4-L7)). No child holds domain state
  (`HabitForm` holds only its own textarea value at [line 10](src/components/HabitForm.tsx#L10)).
- **Server state is fetched imperatively** with raw `fetch` in five handlers and one
  `useEffect`. No caching, no revalidation, no request dedupe, no abort handling. Every
  route handler manually reconstructs a `HabitProfile` from the habit row — the same 8-line
  block is duplicated four times
  ([log/route.ts:34-41](src/app/api/log/route.ts#L34-L41),
  [habit/route.ts:28-35](src/app/api/habit/route.ts#L28-L35),
  [reset/route.ts:13-20](src/app/api/reset/route.ts#L13-L20), and inline in generate). Note
  `keywords` is always reset to `[]` in all four, so the parsed keywords are write-only.
- **Persistence across reloads** is `localStorage.getItem("habitId")`
  ([page.tsx:34](src/app/page.tsx#L34)) → `GET /api/habit?id=` → rehydrate
  ([page.tsx:33-50](src/app/page.tsx#L33-L50)). Everything else is re-derived server-side.
- **Where an avatar component would get its data**: it would receive props from
  `page.tsx`'s `world` object via `HabitWorldCard`, exactly as `streak` and `bgImagePath` do
  today. There is no other channel.

---

## Dead code and loose ends

Ordered roughly by how much they would bite you.

1. **[src/lib/rules/test.ts:3,10](src/lib/rules/test.ts#L3-L10) imports a function that no
   longer exists.** It does `import { generateBackgroundPrompt, generateAccessoryPrompt } from "./prompts"`,
   but `generateAccessoryPrompt` was deleted from [prompts.ts](src/lib/rules/prompts.ts) in
   commit `c70dbc1` (`prompts.ts | 27 --`). The current file exports only
   `generateBackgroundPrompt` ([prompts.ts:28](src/lib/rules/prompts.ts#L28)).
   *Correction (verified in Phase 0):* I originally inferred that `next build` would fail
   type-checking with TS2305, since [tsconfig.json:25-32](tsconfig.json#L25-L32) includes
   `**/*.ts` with no exclusion for this file. **That inference was wrong.** I ran the build
   with the file still present and it passed — Next.js type-checks only files reachable from
   the app graph, not everything in `tsconfig.include`. The import is still definitively
   broken and the file is still dead; it simply was not blocking the build. The file is also
   not a real test: it is a script of `console.log`s with a top-level side-effectful
   `getDb()` at [line 13](src/lib/rules/test.ts#L13), it is not wired to any runner, and
   `package.json` has **no `test` script** ([package.json:4-9](package.json#L4-L9)).

2. **`updateHabitAvatar` targets a nonexistent column** —
   [actions.ts:116-118](src/lib/db/actions.ts#L116-L118). Uncalled; would throw. Detailed above.

3. **The `comfy: on/off` dev toggle is wired to nothing.** `page.tsx` maintains
   `devGeneration` ([line 31](src/app/page.tsx#L31)), renders a toggle button
   ([lines 151-156](src/app/page.tsx#L151-L156)), and conditionally sends
   `skipGeneration: true` in the log request body
   ([line 122](src/app/page.tsx#L122)). But [log/route.ts:9](src/app/api/log/route.ts#L9)
   destructures only `{ habitId, force }` — `skipGeneration` is read by no one, and the log
   route no longer generates images at all. Commit `2a7bdd8` removed the consumer and left
   the producer. Clicking the toggle does nothing.

4. **Orphaned `@keyframes habit-world-float`** — [globals.css:27-30](src/app/globals.css#L27-L30). Unreferenced.

5. **Vestigial accessory columns** — `accessory_prompt`, `accessory_image_path` in
   [schema.ts:44,46](src/lib/db/schema.ts#L44-L46), present in the live DB, never read or
   written.

6. **23 orphaned generated images** — 21 `acc_*.png` and 2 `avatar_*.png` in
   [public/generated/](public/generated/), unreferenceable by any current code path.

7. **Five unused boilerplate SVGs** — `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`,
   `window.svg` in [public/](public/). Zero references in `src/`. These are the only
   *tracked* files in `public/`; note `public/generated/` is gitignored.

8. **Two reset endpoints doing nearly the same thing.**
   [/api/reset](src/app/api/reset/route.ts) (resets + returns a fresh title, wired to the
   "Reset streak" button at [page.tsx:69-78](src/app/page.tsx#L69-L78)) and
   [/api/dev/reset](src/app/api/dev/reset/route.ts) (resets only, dev-gated, wired to the
   dev "reset streak" button at [page.tsx:59-67](src/app/page.tsx#L59-L67)). Both call the
   same `resetStreak()`. Redundant.

9. **`NEXT_PUBLIC_DEV_MODE` gates a server route.** [dev/seed/route.ts:5](src/app/api/dev/seed/route.ts#L5)
   and [dev/reset/route.ts:5](src/app/api/dev/reset/route.ts#L5) guard on a `NEXT_PUBLIC_`
   variable — i.e. one deliberately exposed to the browser bundle. It works, but it is the
   wrong class of variable for a server-side authorization check.

10. **Dev mode's seeded world doesn't persist.** `handleDevMode`
    ([page.tsx:52-57](src/app/page.tsx#L52-L57)) sets `world` but never writes
    `localStorage.habitId`, so a refresh drops you back to the form. Also `DEV_WORLD`
    ([page.tsx:17-24](src/app/page.tsx#L17-L24)) hardcodes
    `bgImagePath: "/generated/bg_3_1_1774247204509.png"` — a gitignored file. On a fresh
    clone that image does not exist and dev mode shows a broken image.

11. **`parseHabit` keyword matching is order-dependent and loose.**
    [habits.ts:52-57](src/lib/rules/habits.ts#L52-L57) iterates `domainKeywords` in
    declaration order and takes the first substring hit. Real evidence from the live DB:
    habit 11, `"eat clean"`, was classified **`chores`** — because `"clean"` is a chores
    keyword — so it got a kitchen/laundry background for a nutrition habit. Substring
    matching also means "run" would match inside unrelated words.

12. **No error handling, anywhere.** No `try`/`catch` in any route handler; no `res.ok`
    check in four of the five client fetches (only the log handler checks, at
    [page.tsx:125](src/app/page.tsx#L125)); no error UI state exists at all.

13. **No migration system.** `CREATE TABLE IF NOT EXISTS` only
    ([schema.ts:17-49](src/lib/db/schema.ts#L17-L49)) — so any column you add to
    `schema.ts` will be silently ignored on an existing `habitar.db`. This is very likely
    how `updateHabitAvatar` came to reference a column that was never created. **Directly
    relevant if your 3D work needs to persist anything per-habit.**

14. **A 3.9 MB WAL file** (`habitar.db-wal`) sits next to a 20 KB database — the DB has not
    been checkpointed. Cosmetic, but it suggests the process is often killed rather than
    closed; `db.close()` is never called.

---

## 3D migration impact

Current state, not a plan. What the code tells me about the shape of the change.

### Already cleanly decoupled — these would not fight you

- **The avatar slot is empty and the seam is intact.** The card renders background and
  chrome only, with `z-10` unoccupied and the deleted avatar's exact container class
  recoverable from `git show 574a3c5`. Dropping a `<Canvas>` into
  [HabitWorldCard.tsx](src/components/HabitWorldCard.tsx) between
  [line 34](src/components/HabitWorldCard.tsx#L34) and
  [line 37](src/components/HabitWorldCard.tsx#L37) is a self-contained insertion.
- **Presentational children.** `HabitWorldCard` is pure props-in
  ([lines 3-18](src/components/HabitWorldCard.tsx#L3-L18)) with no fetching and no internal
  domain state. Adding props is mechanical.
- **Single state owner.** All state is five `useState`s in one file. There is no store to
  reshape, no context providers to thread, no server-state cache to invalidate. Whatever the
  3D layer needs, it comes from `world` in [page.tsx](src/app/page.tsx).
- **The streak→state function is already isolated and pure.** `getStreakState()`
  ([titles.ts:5-12](src/lib/rules/titles.ts#L5-L12)) takes `(number, boolean)` and returns
  one of six string literals, with no I/O. It is already the natural place to map a streak
  onto a growth stage or an animation clip name, and it is already imported across module
  boundaries ([prompts.ts:2](src/lib/rules/prompts.ts#L2)).
- **No competing render or animation tech.** No Lottie, no framer-motion, no CSS transitions
  on the stage, no existing WebGL. Nothing to reconcile with three.js.
- **Backgrounds are character-free by construction** ([prompts.ts:22](src/lib/rules/prompts.ts#L22)),
  so a foreground character does not have to contend with a baked-in one.
- **`public/` static serving already works** for binary assets — GLB files would be fetched
  the same way the PNGs are.

### Entangled — these would resist the change

- **[src/components/HabitWorldCard.tsx](src/components/HabitWorldCard.tsx) is the one hard
  spot, specifically its sizing contract.** The stage is
  `w-full max-w-md … aspect-square … overflow-hidden … rounded-3xl`
  ([lines 20, 27](src/components/HabitWorldCard.tsx#L20-L27)). A WebGL canvas inside a
  fluid, `overflow-hidden`, border-radius-clipped, ≤448 px square container brings
  resize-observer/DPR handling that the current `<img>` gets for free from the browser.
  The `object-cover` background and a perspective camera also do not scale in the same way,
  so the character's apparent size relative to the scene will drift as the card resizes —
  something the SVG avatar, sized in percentages (`w-1/3 h-2/3`), did not have to solve.
- **`bgImagePath` is a scalar string threaded through five layers**, and it is the only
  channel the visual system has. It appears in the `WorldState` interface
  ([page.tsx:12](src/app/page.tsx#L12)), the DEV constant
  ([page.tsx:21](src/app/page.tsx#L21)), three `setWorld` calls
  ([page.tsx:44](src/app/page.tsx#L44), [102](src/app/page.tsx#L102), [132](src/app/page.tsx#L132)),
  the card's props ([HabitWorldCard.tsx:5](src/components/HabitWorldCard.tsx#L5)), three
  route responses ([generate:26](src/app/api/generate/route.ts#L26),
  [log:29,50](src/app/api/log/route.ts#L29), [habit:43](src/app/api/habit/route.ts#L43)),
  and the DB ([actions.ts:84-91](src/lib/db/actions.ts#L84-L91)). Any per-habit 3D state
  (model variant, stage, appearance) has to be threaded through every one of those same
  points — there is no object or store to extend in one place.
- **There is no persistence path for avatar appearance, and no migration mechanism to add
  one.** The old avatar's `bodyType`/`skinTone` were React-state-only and lost on reload;
  the `habits` table has no appearance columns; and `CREATE TABLE IF NOT EXISTS`
  ([schema.ts:17](src/lib/db/schema.ts#L17)) will not add columns to the existing
  `habitar.db`. If a GLB variant needs to survive a refresh, this has to be built, and
  existing local databases will need manual attention.
- **`getStreakState`'s six states do not map to a growth ladder.** `recovery` is not a
  growth stage — it is an orthogonal mood that *overrides* the streak entirely
  ([titles.ts:6](src/lib/rules/titles.ts#L6)). So you have five ordinal stages plus one
  wildcard. And per the mapping section, the milestone set `{1,3,7,14,30}` that actually
  triggers updates is misaligned with the state boundaries `{1,4,8,21}`. If stage changes
  drive model or animation swaps, that misalignment becomes visible as characters changing
  on the wrong days — worth resolving before, not during, the 3D work.
- **`recovery` is currently unreachable** because of the unconditional `force: true`
  ([page.tsx:121](src/app/page.tsx#L121), [actions.ts:63](src/lib/db/actions.ts#L63)). Any
  "sad/recovering character" state you build cannot be exercised through the UI until that
  is addressed.
- **No loading or error state exists to hang GLB loading off.** The `<img>` needs none;
  a GLB does. There is no `<Suspense>` boundary anywhere, no error boundary, and the only
  loading affordances are two booleans used for button labels
  ([page.tsx:29-30](src/app/page.tsx#L29-L30)). Async asset loading is a new concern for
  this codebase.
- **`"use client"` is already on every component** ([page.tsx:1](src/app/page.tsx#L1),
  [HabitWorldCard.tsx:1](src/components/HabitWorldCard.tsx#L1)), so SSR-mismatch pain for a
  canvas is mostly pre-avoided — but [layout.tsx](src/app/layout.tsx) already carries
  `suppressHydrationWarning` on `<body>` ([line 17](src/app/layout.tsx#L17)), which means
  hydration noise has been papered over before and would be easy to mask again rather than
  fix.

### Files that would need to change

| File | Why |
|---|---|
| [src/components/HabitWorldCard.tsx](src/components/HabitWorldCard.tsx) | Insert the canvas layer at z-10; new props; sizing/DPR |
| [src/app/page.tsx](src/app/page.tsx) | Extend `WorldState` ([8-15](src/app/page.tsx#L8-L15)), the three `setWorld` calls, `DEV_WORLD`, and the props passed at [168-180](src/app/page.tsx#L168-L180) |
| **new** avatar/3D component(s) | Does not exist today |
| [package.json](package.json) | `three`, `@react-three/fiber`, `@react-three/drei` — none present |
| [src/lib/rules/titles.ts](src/lib/rules/titles.ts) | If `getStreakState` is to drive model/clip selection |
| [src/app/api/log/route.ts](src/app/api/log/route.ts) | Milestone set at [line 6](src/app/api/log/route.ts#L6) if stage changes are milestone-gated; response shape |
| [src/app/api/habit/route.ts](src/app/api/habit/route.ts) | Response shape on rehydrate ([39-46](src/app/api/habit/route.ts#L39-L46)) |
| [src/lib/db/schema.ts](src/lib/db/schema.ts) + [actions.ts](src/lib/db/actions.ts) | Only if appearance must persist — and see the migration caveat |
| [public/](public/) | New home for `.glb` assets |
| [next.config.ts](next.config.ts) | Currently empty ([lines 3-5](next.config.ts#L3-L5)); may need asset/transpile config |

**Untouched:** [src/lib/ai/](src/lib/ai/) (ComfyUI is background-only and orthogonal),
[src/components/HabitForm.tsx](src/components/HabitForm.tsx),
[src/lib/rules/habits.ts](src/lib/rules/habits.ts),
[src/lib/rules/prompts.ts](src/lib/rules/prompts.ts).

---

## Open questions

1. **Was the avatar's removal intended to be permanent, or was it a "scale down to ship"
   move you now want to reverse?** The branch was literally named `scale-down`
   (merge commit `1761440`). This changes whether the 3D work is a *replacement* or a
   *restoration with better tech* — and whether the deleted `AvatarPicker` onboarding step
   comes back.

2. **Should the character's appearance be user-chosen, streak-derived, or both?** The old
   system was purely user-chosen (bodyType + skinTone, never touched by streak) — which is
   the opposite of what the briefing describes. Which model do you want?

3. **If appearance is user-chosen, must it persist across reloads?** It did not before. If
   yes, this needs new DB columns *and* a story for existing `habitar.db` files, since
   `CREATE TABLE IF NOT EXISTS` will not add them.

4. **How many discrete growth stages, and at what streak values?** There are currently two
   conflicting answers in the code — the state boundaries `{1,4,8,21}` and the milestone set
   `{1,3,7,14,30}`. I could not determine which is the intended design.

5. **Is `recovery` a distinct character state (a sad/rebuilding model or clip), or just a
   text mood?** And do you want the `force: true` bypass removed so real date logic runs?
   As written it is impossible to reach recovery through the UI.

6. **Should the background stay AI-generated per habit, or become part of the 3D scene?**
   If backgrounds stay 2D PNGs behind a 3D character, you are committing to a 2.5D
   composite. If the environment becomes 3D too, the entire ComfyUI integration is
   potentially obsolete — which would be a much larger change than the briefing implies.

7. **Should the environment start growing again?** Right now it does not, at all (commit
   `2a7bdd8`). The briefing says the environment grows with the streak; the code generates
   one image and reuses it forever. Is restoring that in scope, out of scope, or replaced by
   the 3D work?

8. **Where do the GLB files come from, and how many?** Nothing in the repo produces or
   references 3D assets. Whether these are authored by hand, purchased, or generated
   determines the count and consistency you can rely on — and I cannot infer it from code.

9. **Is `src/lib/rules/test.ts` still wanted?** It has a broken import and is not runnable.
   I did not determine whether you consider it a scratch file or an unfinished intention to
   add tests.

10. **Which ComfyUI port is correct — 8000 or 8188?** The code default, the committed
    `.env.local`, and the README do not agree.

11. **Is single-habit, `localStorage`-keyed, single-user a permanent constraint?** There is
    no user table and no auth. If multi-habit or multi-user is coming, that reshapes state
    management far more than the 3D swap does, and the two changes would interact.
