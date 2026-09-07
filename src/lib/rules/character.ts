import { GROWTH_STAGES, getStreakState, type StreakState } from "./titles";

/*
 * Character appearance rules.
 *
 * Two orthogonal inputs, deliberately kept separate:
 *
 *   GROWTH  — streak-derived, not user-controlled. One of the five ordinal
 *             stages in GROWTH_STAGES, imported from titles.ts. The ladder is
 *             defined there and only there; nothing in this file redefines it.
 *
 *   MOOD    — `recovery`, which is NOT a stage. It is an override that applies
 *             on top of whatever growth stage is current: a user on a 30-day
 *             streak who misses a day is still `elite` in growth terms, but
 *             should read as recovering. So the treatment is composed, not
 *             substituted.
 *
 * Phase 1 expresses growth as scale + colour on a placeholder primitive.
 * Phase 2 keeps the same shape of mapping but swaps the visual payload for
 * model/clip selection — see the asset contract at the bottom of this file
 * and ASSETS.md.
 */

/** The five ordinal growth stages. Re-exported so callers need one import. */
export { GROWTH_STAGES };
export type GrowthStage = (typeof GROWTH_STAGES)[number];

export interface CharacterTreatment {
  /** Uniform scale applied to the character. */
  scale: number;
  /** Base material colour, hex. */
  color: string;
  /** 0..1. Drives material saturation/among other things emissive lift. */
  vitality: number;
}

/**
 * Growth ladder as a visual treatment. Small and pale at `start`, large and
 * saturated at `elite`. Scale is intentionally sub-linear: the character must
 * still fit the 1.58 x 3.15 world-unit frame at `elite` (see the sizing
 * contract in CharacterCanvas), so the top of the ladder is 1.45x, not 3x.
 */
const GROWTH_TREATMENTS: Record<GrowthStage, CharacterTreatment> = {
  start:     { scale: 0.70, color: "#d9c9b2", vitality: 0.10 },
  building:  { scale: 0.87, color: "#d2a878", vitality: 0.32 },
  committed: { scale: 1.04, color: "#c98f56", vitality: 0.54 },
  strong:    { scale: 1.24, color: "#c17f4a", vitality: 0.78 },
  elite:     { scale: 1.45, color: "#b4652a", vitality: 1.00 },
};

/**
 * Applied on top of the current growth treatment when the user missed a day.
 * Deliberately readable at a glance and distinct from every growth rung:
 * desaturated toward a cool grey, slightly shrunk, low vitality — but it keeps
 * a trace of the growth scale so a recovering veteran still reads as bigger
 * than a recovering beginner.
 */
const RECOVERY_SCALE_FACTOR = 0.88;
const RECOVERY_COLOR = "#8d8c93";
const RECOVERY_VITALITY = 0.16;

/**
 * Resolve the treatment for a display state.
 *
 * `stage` here is the full StreakState from getStreakState, so it may be
 * "recovery". That is the only place recovery is admitted, and it is handled
 * as a composition over the growth stage rather than as a sixth rung.
 *
 * The caller supplies the underlying growth stage separately, because
 * getStreakState collapses it: once missedYesterday is true it returns
 * "recovery" and the growth rung is no longer recoverable from that value
 * alone. Callers that only have the collapsed value can pass "start".
 */
export function resolveTreatment(
  stage: StreakState,
  growthStage: GrowthStage = "start",
): CharacterTreatment {
  if (stage === "recovery") {
    const base = GROWTH_TREATMENTS[growthStage];
    return {
      scale: +(base.scale * RECOVERY_SCALE_FACTOR).toFixed(4),
      color: RECOVERY_COLOR,
      vitality: RECOVERY_VITALITY,
    };
  }
  return GROWTH_TREATMENTS[stage];
}

/**
 * Growth stage for a raw streak count, ignoring recovery.
 *
 * Delegates to getStreakState with missedYesterday=false, which by definition
 * returns one of the five growth stages. The thresholds are NOT repeated here
 * - titles.ts owns the ladder, and duplicating the boundaries is exactly the
 * contradiction phase 0 removed.
 */
export function growthStageForStreak(streak: number): GrowthStage {
  return getStreakState(streak, false) as GrowthStage;
}

/* ------------------------------------------------------------------ */
/* PHASE 2 ASSET CONTRACT — types only. No assets exist yet.           */
/* Prose version, with budgets and rationale, is in ASSETS.md.          */
/* ------------------------------------------------------------------ */

/**
 * Identifies which creature the user picked. Persisted in
 * habits.character_id. Null until onboarding sets it.
 */
export type CharacterId = string;

/**
 * Identifies the colourway. Persisted in habits.character_variant.
 *
 * DECISION: a variant is a MATERIAL SWAP applied to one shared GLB, not a
 * separate file. One download per creature, and adding a colourway costs a
 * palette entry rather than a new asset. See ASSETS.md for the reasoning.
 */
export type CharacterVariant = string;

/** Animation clips every character GLB must contain, one per growth stage. */
export const REQUIRED_CLIPS = [
  "idle_start",
  "idle_building",
  "idle_committed",
  "idle_strong",
  "idle_elite",
  "idle_recovery",
] as const;

export type ClipName = (typeof REQUIRED_CLIPS)[number];

/** Which clip a display state plays. recovery has its own clip, not a modifier. */
export function clipForStage(stage: StreakState): ClipName {
  return (`idle_${stage}` as ClipName);
}

/** Resolves to public/characters/<id>.glb — see ASSETS.md for the scheme. */
export function modelPath(characterId: CharacterId): string {
  return `/characters/${characterId}.glb`;
}
