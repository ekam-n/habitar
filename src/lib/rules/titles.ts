import { HabitProfile } from "./habits";

type StreakState = "start" | "building" | "committed" | "strong" | "elite" | "recovery";

export function getStreakState(streak: number, missedYesterday: boolean): StreakState {
  if (missedYesterday) return "recovery";
  if (streak === 0)    return "start";
  if (streak < 4)      return "building";
  if (streak < 8)      return "committed";
  if (streak < 21)     return "strong";
  return "elite";
}

const titleTemplates: Record<HabitProfile["domain"], Record<StreakState, string[]>> = {
  fitness: {
    start:     ["The Beginner", "New to the Grind", "Day One Lifter"],
    building:  ["The Consistent One", "Early Riser", "Building Strength"],
    committed: ["Committed Athlete", "The Grinder", "Dedicated Lifter"],
    strong:    ["Iron Discipline", "The Warrior", "Unstoppable Force"],
    elite:     ["Elite Performer", "The Unbreakable", "Legend of the Gym"],
    recovery:  ["Bouncing Back", "The Resilient", "Rising Again"],
  },
  study: {
    start:     ["Curious Mind", "New Scholar", "First Page"],
    building:  ["The Learner", "Building Focus", "Consistent Reader"],
    committed: ["Dedicated Scholar", "The Focused One", "Deep Thinker"],
    strong:    ["Knowledge Seeker", "The Disciplined", "Academic Warrior"],
    elite:     ["Master of Focus", "The Enlightened", "Scholar Supreme"],
    recovery:  ["Back to the Books", "Refocused Mind", "The Returner"],
  },
  wellness: {
    start:     ["First Breath", "New to Peace", "Beginning Calm"],
    building:  ["Growing Stillness", "The Grounded", "Building Balance"],
    committed: ["Mindful One", "Calm Seeker", "Daily Restorer"],
    strong:    ["Centered Soul", "The Balanced", "Wellness Guardian"],
    elite:     ["Inner Peace Master", "The Serene", "Harmony Keeper"],
    recovery:  ["Returning to Calm", "Gentle Restart", "Soft Reset"],
  },
  creativity: {
    start:     ["The Spark", "New Creator", "First Stroke"],
    building:  ["Growing Artist", "The Curious", "Building Flow"],
    committed: ["Daily Creator", "The Devoted", "Consistent Maker"],
    strong:    ["The Craftsperson", "Inspired Force", "Creative Warrior"],
    elite:     ["Master Creator", "The Visionary", "Artisan Supreme"],
    recovery:  ["Rekindled Spark", "Back to Creating", "The Returner"],
  },
  chores: {
    start:     ["First Steps", "New Routine", "Starting Fresh"],
    building:  ["The Tidier", "Building Order", "Getting Consistent"],
    committed: ["Order Keeper", "The Reliable", "Household Guardian"],
    strong:    ["Master of Order", "The Disciplined", "Home Warrior"],
    elite:     ["Domestic Legend", "The Unshakeable", "Order Supreme"],
    recovery:  ["Back on Track", "Resetting Order", "The Returner"],
  },
  general: {
    start:     ["Day One", "The Beginning", "Starting Out"],
    building:  ["Building Momentum", "The Consistent", "Early Streak"],
    committed: ["Committed", "The Dedicated", "Staying Power"],
    strong:    ["Strong Streak", "The Reliable", "Power Builder"],
    elite:     ["Streak Legend", "The Unstoppable", "Elite Habit"],
    recovery:  ["Bouncing Back", "The Resilient", "Fresh Start"],
  },
};

const buttonLabels: Record<HabitProfile["domain"], string> = {
  fitness:    "Log Workout",
  study:      "Log Study Session",
  wellness:   "Log Check-In",
  creativity: "Log Creative Session",
  chores:     "Log Task Done",
  general:    "Log Progress",
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateTitle(profile: HabitProfile, streak: number, missedYesterday: boolean): string {
  const state = getStreakState(streak, missedYesterday);
  const options = titleTemplates[profile.domain][state];
  return pick(options);
}

export function generateButtonLabel(profile: HabitProfile): string {
  return buttonLabels[profile.domain];
}