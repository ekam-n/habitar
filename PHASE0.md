# Phase 0 — Groundwork for 3D Avatars

Preparation only. No 3D dependency was installed, no avatar component was
created, and nothing renders a character yet. This phase removed dead code,
resolved contradictions the diagnostic found, and built the plumbing the canvas
will plug into.

Seven commits, one per task, `ba71aa2..3232f55`. `npm run build` passes after
each.

---

## What changed

### 1. Unbroke the build — `ba71aa2`

Deleted `src/lib/rules/test.ts` (imported `generateAccessoryPrompt`, removed in
`c70dbc1`; no runner, no `test` script).

**Correction to DIAGNOSTIC.md:** it inferred this file was failing
`next build` with TS2305. It was not. I ran the build with the file still
present and it passed — Next.js type-checks only what is reachable from the app
graph, not everything in `tsconfig.include`. The import was genuinely broken and
the file was genuinely dead, but the build was never red. DIAGNOSTIC.md has been
corrected in place.

### 2. Removed dead code — `1c26c00`

- `updateHabitAvatar()` — wrote to `habits.avatar_image_path`, which does not
  exist. Confirmed absent from the live database.
- `@keyframes habit-world-float` — referenced by nothing.
- `devGeneration` state, the `comfy: on/off` toggle, and the `skipGeneration`
  request field — `/api/log` stopped reading it in `2a7bdd8`.
- `/api/dev/reset` — deleted; its button now calls `/api/reset`, which already
  resets the streak and returns a fresh title. The duplicate `handleResetStreak`
  handler went with it.
- 5 boilerplate SVGs in `public/`.
- 30 orphaned generated images (28 `acc_*`, 2 `avatar_*`). DIAGNOSTIC.md said 21
  `acc_*`; the real count was 28.
- ComfyUI port now reads **8188** in `comfy.ts`, `.env.local`, and the README.

### 3. Fixed the streak ladder — `264f667`

See the next section.

### 4. Migration runner + appearance persistence — `55a579b`

See "How the migration runner works".

### 5. Fixed the streak bugs — `65b7f8f`

- `force: true` was sent on **every** log, not just in dev. It bypassed the
  once-a-day guard and the consecutive-day check and pinned `missedYesterday` to
  0, so `recovery` was unreachable and its banner could never render. Now sent
  only under `NEXT_PUBLIC_DEV_MODE`; still supported server-side.
- `getLatestGeneration` ordered by `created_at`, which is `datetime('now')` at
  one-second resolution. Now `ORDER BY id DESC`. The two same-second collisions
  in the live DB (habits 4 and 11) happen not to be the newest rows for their
  habit, so both orderings agree on today's data — this removes latent
  nondeterminism rather than a currently-visible wrong title.

### 6. Threaded stage + appearance — `4af96f1`

- `WorldState` gains `stage`, `characterId`, `characterVariant`; all four
  `setWorld` calls updated.
- `/api/habit` returns the persisted appearance; `/api/generate` returns nulls;
  `/api/reset` now returns `stage` too, since it zeroes the streak.
- `HabitWorldCard` accepts all three and renders none of them.
- Added committed `public/placeholder-world.svg`. `DEV_WORLD` previously pointed
  at `/generated/bg_3_1_1774247204509.png`, which is gitignored and absent on a
  fresh clone.
- `handleDevMode` writes `localStorage.habitId`, so dev mode survives a refresh.

### 7. Loading/error seam — `3232f55`

- try/catch on every route handler, JSON error + status code.
- `/api/generate` returns **502** naming the configured `COMFY_URL`, and deletes
  the habit row it just created if generation fails — the row is written before
  the image, so each failed retry used to leave an orphan.
- `res.ok` checks on all five client fetches.
- One `error: string | null` state with a dismissible banner.
- Background `<img>` falls back to the placeholder `onError`, guarded against a
  loop.
- A stale `localStorage.habitId` is now cleared instead of stranding the user on
  an empty world.

---

## The stage ladder

`getStreakState()` in [src/lib/rules/titles.ts](src/lib/rules/titles.ts) is now
the **single source of truth**. `TITLE_MILESTONES` is gone.

| Stage | Streak |
|---|---|
| `start` | 0 |
| `building` | 1–3 |
| `committed` | 4–7 |
| `strong` | 8–20 |
| `elite` | 21+ |
| `recovery` | any streak, when `missedYesterday` — checked first, overrides |

`GROWTH_STAGES` exports the five ordinal stages as an ordered array.
**`recovery` is deliberately not a member** — it is an orthogonal mood that
overrides display, not a rung on the ladder. Use `GROWTH_STAGES` to compare or
advance; use the `stage` field to decide what to show.

`/api/log` computes the stage before and after the log and refreshes the title
**iff the stage changed or `missedYesterday`**. Verified against a running
server, walking a habit from 0 to 9:

```
streak 1  stage=building   "The Consistent One"   <-- refreshed
streak 2  stage=building   "The Consistent One"
streak 3  stage=building   "The Consistent One"
streak 4  stage=committed  "Dedicated Lifter"     <-- refreshed
streak 5  stage=committed  "Dedicated Lifter"
streak 6  stage=committed  "Dedicated Lifter"
streak 7  stage=committed  "Dedicated Lifter"
streak 8  stage=strong     "Unstoppable Force"    <-- refreshed
streak 9  stage=strong     "Unstoppable Force"
```

Refreshes at 1, 4, 8 — exactly the boundaries. Under the old milestone set it
fired at 1, 3, 7, 14, 30, where 3 produced a same-bucket reshuffle and 4, 8 and
21 were silently skipped.

`recovery` is reachable again, confirmed by setting `last_logged_date` three days
back and logging without `force`:

```json
{"streak":1,"stage":"recovery","missedYesterday":true,"title":"The Resilient"}
```

---

## How the migration runner works

In [src/lib/db/schema.ts](src/lib/db/schema.ts). `getDb()` now calls
`initTables(db)` then `migrate(db)`.

`CREATE TABLE IF NOT EXISTS` silently ignores new columns on a database that
already exists, so editing `initTables` alone does nothing to an installed
`habitar.db`. That is exactly how `habits.avatar_image_path` came to be
referenced in code but never created. `migrate()` closes that gap:

- **`EXPECTED_COLUMNS`** — for each entry, check `PRAGMA table_info(<table>)` and
  `ALTER TABLE ... ADD COLUMN` if absent. Currently `habits.character_id` and
  `habits.character_variant`, both `TEXT` and nullable: "not chosen yet" is a
  real state, so no DB-level default.
- **`REMOVED_COLUMNS`** — drop if still present. Currently
  `generations.accessory_prompt` and `generations.accessory_image_path`. SQLite
  here is 3.51.3 and `DROP COLUMN` (3.35+) worked cleanly; the call is wrapped in
  try/catch so an older engine just leaves the unused columns alone.

Every step is guarded by a `PRAGMA` check, so it is idempotent.

> **The rule for later phases:** a new column must be declared in **both**
> `initTables` (for fresh databases) **and** `EXPECTED_COLUMNS` (for existing
> ones). One without the other reintroduces the original bug. This is documented
> in the file itself.

**Verified against the real `habitar.db`**, across three separate processes:

| | before | after |
|---|---|---|
| habits / streaks / generations | 12 / 12 / 63 | 12 / 12 / 63 |
| `sum(streak_count)` | 68 | 68 |
| rows with a `bg_image_path` | 63 | 63 |

Columns settle after the first run and do not change on runs 2 and 3. A fresh
database and a migrated existing one end up with identical schemas.

`getHabitAppearance` / `setHabitAppearance` in
[src/lib/db/actions.ts](src/lib/db/actions.ts) were round-tripped end to end:
set → persisted → surfaced by `GET /api/habit` → reverted. A missing habit id
returns `null` rather than throwing.

---

## What the 3D layer plugs into

Everything below already exists and carries real values.

**The render slot.** [src/components/HabitWorldCard.tsx](src/components/HabitWorldCard.tsx)
is unchanged in shape: background `<img>` at the base of the stacking context,
chrome at `z-20`, and **`z-10` still vacant**. That is where the canvas goes,
between the `<img>` (line ~45) and the streak chip (line ~59).

**The props.** The card already accepts and ignores:

```ts
stage: StreakState;             // streak-derived; drives model / clip choice
characterId: string | null;     // user-chosen creature
characterVariant: string | null;// user-chosen colourway
```

Consuming them is a change inside the card only. Nothing upstream needs to move.

**The data path.** `page.tsx` `WorldState` → `HabitWorldCard` props. `stage`
comes from the server on every response that can change it (`/api/generate`,
`/api/log`, `/api/habit`, `/api/reset`). Appearance comes from `/api/habit` on
rehydrate and persists in `habits.character_id` / `character_variant`.

**The error seam.** A single `error` state and a rendered banner exist, so a GLB
load failure has somewhere to report to. `PLACEHOLDER_BG` is exported from the
card and committed to `public/`, so there is a real fallback asset.

### Still missing, deliberately

- **No write path for appearance.** `setHabitAppearance` exists but no route
  calls it. The AvatarPicker onboarding step and its endpoint are phase 1.
- **No `<Suspense>` or error boundary.** The `error` state handles fetch
  failures; async *asset* loading has no boundary yet.
- **No loading affordance for the canvas.** `loading` and `logging` drive button
  labels only.
- **The card's sizing contract is untouched** and is still the main friction
  point: `w-full max-w-md` + `aspect-square` + `overflow-hidden` +
  `rounded-3xl`. A WebGL canvas in a fluid, clipped, ≤448 px square container
  needs resize/DPR handling the `<img>` got for free.

### Two footguns worth knowing

1. **Deleting a route breaks the build until `.next/dev` is cleared.**
   `tsconfig.json` includes `.next/dev/types/**/*.ts`, and the dev server's
   generated validator still imports the deleted route. Symptom:
   `Cannot find module '../../../src/app/api/<route>/route.js'`. Fix:
   `rm -rf .next/dev`. Hit this when removing `/api/dev/reset`.

2. **The `error` slot is overloaded.** It carries genuine errors *and* the
   "Already logged today" notice, which became reachable the moment `force:true`
   went dev-only. It reads acceptably now, but if the 3D layer adds more
   messages this should split into notice vs. error rather than growing.

---

## Not done, on purpose

- No `three`, `@react-three/fiber`, or `drei`. `package.json` dependencies are
  unchanged.
- No avatar component.
- `src/lib/ai/` untouched apart from the port default, as instructed.
- Pre-existing `@typescript-eslint/no-explicit-any` errors in `actions.ts` and
  `comfy.ts` left alone — they predate this phase and fixing them is a refactor.
  `npm run build` does not run eslint, so they do not block anything.
- `parseHabit`'s loose substring matching left as-is (`"eat clean"` still
  classifies as `chores`).
