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

export function logHabit(habitId: number) {
  const db = getDb();
  const streak = getStreak(habitId);
  const today = new Date().toISOString().split("T")[0];
  const lastLogged = streak.last_logged_date;

  // Already logged today
  if (lastLogged === today) {
    return { alreadyLogged: true, streak: streak.streak_count };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const consecutive = lastLogged === yesterday;
  const newStreak = consecutive ? streak.streak_count + 1 : 1;
  const missedYesterday = lastLogged !== null && !consecutive ? 1 : 0;

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