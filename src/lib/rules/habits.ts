export type HabitProfile = {
  domain: "fitness" | "study" | "wellness" | "creativity" | "chores" | "general";
  tone: "energetic" | "calm" | "disciplined" | "playful";
  setting: "gym" | "studio" | "library" | "outdoors" | "home" | "workspace";
  rewardStyle: "intense" | "soft" | "cozy" | "bold";
  keywords: string[];
  rawInput: string;
};

const domainKeywords: Record<HabitProfile["domain"], string[]> = {
  fitness: ["gym", "workout", "run", "lift", "pilates", "yoga", "swim", "train", "exercise", "cycling"],
  study:   ["study", "read", "learn", "code", "homework", "research", "notes", "review", "exam"],
  wellness:["meditate", "sleep", "water", "journal", "breathe", "stretch", "rest", "mindful"],
  creativity: ["draw", "paint", "write", "music", "design", "sketch", "create", "art", "blog"],
  chores:  ["clean", "cook", "organize", "tidy", "laundry", "dishes", "meal prep"],
  general: [],
};

const toneMap: Record<HabitProfile["domain"], HabitProfile["tone"]> = {
  fitness:    "energetic",
  study:      "disciplined",
  wellness:   "calm",
  creativity: "playful",
  chores:     "disciplined",
  general:    "calm",
};

const settingMap: Record<HabitProfile["domain"], HabitProfile["setting"]> = {
  fitness:    "gym",
  study:      "library",
  wellness:   "home",
  creativity: "workspace",
  chores:     "home",
  general:    "home",
};

const rewardStyleMap: Record<HabitProfile["domain"], HabitProfile["rewardStyle"]> = {
  fitness:    "intense",
  study:      "bold",
  wellness:   "soft",
  creativity: "cozy",
  chores:     "soft",
  general:    "cozy",
};

export function parseHabit(input: string): HabitProfile {
  const lower = input.toLowerCase();
  const words = lower.split(/\s+/);

  let domain: HabitProfile["domain"] = "general";

  for (const [key, kws] of Object.entries(domainKeywords)) {
    if (kws.some((kw) => lower.includes(kw))) {
      domain = key as HabitProfile["domain"];
      break;
    }
  }

  return {
    domain,
    tone:        toneMap[domain],
    setting:     settingMap[domain],
    rewardStyle: rewardStyleMap[domain],
    keywords:    words.filter((w) => w.length >= 3),
    rawInput:    input,
  };
}