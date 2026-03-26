import { getDb } from "./schema";
import { HabitProfile } from "../rules/habits";

export function createHabit(profile: HabitProfile, buttonLabel: string) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO habits (raw_input, domain, tone, setting, reward_style, button_label)
    VALUES (@raw_input, @domain, @tone, @setting, @reward_style, @button_label)
  `);
  const result = stmt.run({
    raw_input:    profile.rawInput,
    domain:       profile.domain,
    tone:         profile.tone,
    setting:      profile.setting,
    reward_style: profile.rewardStyle,
    button_label: buttonLabel,
  });

  const habitId = result.lastInsertRowid as number;

  db.prepare(`
    INSERT INTO streaks (habit_id, streak_count, last_logged_date, missed_yesterday)
    VALUES (?, 0, NULL, 0)
  `).run(habitId);

  return habitId;
}

export function getHabit(habitId: number) {
  const db = getDb();
  return db.prepare(`SELECT * FROM habits WHERE id = ?`).get(habitId) as any;
}

export function getStreak(habitId: number) {
  const db = getDb();
  return db.prepare(`SELECT * FROM streaks WHERE habit_id = ?`).get(habitId) as any;
}

export function getOrCreateDevHabit(): number {
  const db = getDb();
  const existing = db.prepare(`SELECT id FROM habits WHERE raw_input = '__dev__' LIMIT 1`).get() as any;
  if (existing) return existing.id;
  return createHabit(
    { rawInput: "__dev__", domain: "fitness", tone: "energetic", setting: "outdoors", rewardStyle: "bold", keywords: [] },
    "Log Today's Run"
  );
}

export function logHabit(habitId: number, force = false) {
  const db = getDb();
  const streak = getStreak(habitId);
  const today = new Date().toISOString().split("T")[0];
  const lastLogged = streak.last_logged_date;

  // Already logged today
  if (!force && lastLogged === today) {
    return { alreadyLogged: true, streak: streak.streak_count };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const consecutive = force ? true : lastLogged === yesterday;
  const newStreak = consecutive ? streak.streak_count + 1 : 1;
  const missedYesterday = (!force && lastLogged !== null && !consecutive) ? 1 : 0;

  db.prepare(`
    UPDATE streaks
    SET streak_count = ?, last_logged_date = ?, missed_yesterday = ?
    WHERE habit_id = ?
  `).run(newStreak, today, missedYesterday, habitId);

  return { alreadyLogged: false, streak: newStreak, missedYesterday: missedYesterday === 1 };
}

export function saveGeneration(data: {
  habitId: number;
  streakAtTime: number;
  title: string;
  bgPrompt: string;
  accessoryPrompt: string;
  bgImagePath?: string;
  accessoryImagePath?: string;
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO generations
      (habit_id, streak_at_time, title, bg_prompt, accessory_prompt, bg_image_path, accessory_image_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.habitId,
    data.streakAtTime,
    data.title,
    data.bgPrompt,
    data.accessoryPrompt,
    data.bgImagePath ?? null,
    data.accessoryImagePath ?? null,
  );
}

export function getLatestGeneration(habitId: number) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM generations WHERE habit_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(habitId) as any;
}

export function resetStreak(habitId: number) {
  getDb().prepare(`
    UPDATE streaks SET streak_count = 0, last_logged_date = NULL, missed_yesterday = 0
    WHERE habit_id = ?
  `).run(habitId);
}

export function updateHabitAvatar(habitId: number, avatarImagePath: string) {
  getDb().prepare(`UPDATE habits SET avatar_image_path = ? WHERE id = ?`).run(avatarImagePath, habitId);
}