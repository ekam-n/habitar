import { HabitProfile } from "./habits";
import { getStreakState } from "./titles";

const sceneTemplates: Record<HabitProfile["domain"], string[]> = {
  fitness:    ["a gym training ground", "an outdoor athletic track", "a weight room", "a boxing studio"],
  study:      ["a cozy library nook", "a sunlit study desk", "a late-night research room", "a campus courtyard"],
  wellness:   ["a peaceful meditation garden", "a soft morning bedroom", "a zen yoga studio", "a misty forest clearing"],
  creativity: ["a warm artist's studio", "a cluttered sketchbook desk", "a music room with soft light", "a painter's loft"],
  chores:     ["a clean bright kitchen", "a tidy organized home", "a morning household scene", "a fresh laundry room"],
  general:    ["a calm personal space", "a simple cozy room", "a motivating workspace"],
};

const progressDescriptors: Record<ReturnType<typeof getStreakState>, string> = {
  start:     "simple, clean, early morning light, minimal",
  building:  "warm, growing, soft glow, inviting",
  committed: "confident, focused, mid-day brightness, structured",
  strong:    "vivid, energized, golden hour light, powerful",
  elite:     "dramatic, glowing, epic atmosphere, legendary",
  recovery:  "gentle, soft, dawn light, hopeful, calm",
};

const styleInstruction = "flat vector illustration style, clean lines, soft color palette, no text, no characters, no faces";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateBackgroundPrompt(profile: HabitProfile, streak: number, missedYesterday: boolean): string {
  const state = getStreakState(streak, missedYesterday);
  const scene = pick(sceneTemplates[profile.domain]);
  const progress = progressDescriptors[state];
  return `${scene}, ${progress}, ${styleInstruction}`;
}

const domainProps: Record<HabitProfile["domain"], string[]> = {
  fitness:    ["a dumbbell", "a water bottle", "a medal", "a pair of running shoes", "a kettlebell", "a protein shaker"],
  study:      ["a stack of books", "an open notebook", "a pencil", "a desk lamp", "a graduation cap", "a pair of glasses"],
  wellness:   ["a candle", "a yoga mat", "a tea cup", "a small potted plant", "a journal", "a water glass"],
  creativity: ["a paintbrush", "a sketchpad", "a music note", "a pair of headphones", "a camera", "a pencil case"],
  chores:     ["a broom", "a mop bucket", "a laundry basket", "a cleaning spray bottle", "a vacuum cleaner", "a dish rack"],
  general:    ["a calendar", "a checkmark badge", "a clock", "a to-do list", "a key", "a star badge"],
};

export function generateAccessoryPrompt(profile: HabitProfile): string {
  const prop = pick(domainProps[profile.domain]);
  return `${prop}, simple flat vector icon, bold clean shape, centered composition, white background, no hands, no people, no text, minimal detail, graphic design style`;
}