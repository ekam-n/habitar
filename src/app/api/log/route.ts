import { NextRequest, NextResponse } from "next/server";
import { generateTitle, getStreakState } from "@/lib/rules/titles";
import { logHabit, getHabit, getStreak, getLatestGeneration, saveGeneration } from "@/lib/db/actions";
import { HabitProfile } from "@/lib/rules/habits";

export async function POST(req: NextRequest) {
  const { habitId, force } = await req.json();

  if (habitId == null) {
    return NextResponse.json({ error: "No habitId provided" }, { status: 400 });
  }

  const before = getStreak(habitId);
  if (!before) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }
  const beforeState = getStreakState(before.streak_count, before.missed_yesterday === 1);

  const result = logHabit(habitId, force === true);

  if (result.alreadyLogged) {
    return NextResponse.json({
      alreadyLogged: true,
      streak: result.streak,
      stage:  beforeState,
    });
  }

  const { streak, missedYesterday = false } = result;
  const stage = getStreakState(streak, missedYesterday);
  const latest = getLatestGeneration(habitId);

  // Refresh the title only when the stage actually changes, or on a recovery
  // log. There is deliberately no separate milestone set: getStreakState is
  // the single source of truth for when the world moves on.
  if (stage === beforeState && !missedYesterday) {
    return NextResponse.json({
      streak,
      stage,
      missedYesterday,
      title:       latest?.title ?? "",
      bgImagePath: latest?.bg_image_path ?? null,
    });
  }

  const habit = getHabit(habitId);
  const profile: HabitProfile = {
    domain:      habit.domain,
    tone:        habit.tone,
    setting:     habit.setting,
    rewardStyle: habit.reward_style,
    keywords:    [],
    rawInput:    habit.raw_input,
  };

  const title = generateTitle(profile, streak, missedYesterday);
  saveGeneration({ habitId, streakAtTime: streak, title, bgImagePath: latest?.bg_image_path });

  return NextResponse.json({
    streak,
    stage,
    missedYesterday,
    title,
    bgImagePath: latest?.bg_image_path ?? null,
  });
}
