import { NextRequest, NextResponse } from "next/server";
import { generateTitle } from "@/lib/rules/titles";
import { logHabit, getHabit, getLatestGeneration, saveGeneration } from "@/lib/db/actions";
import { HabitProfile } from "@/lib/rules/habits";

const TITLE_MILESTONES = new Set([1, 3, 7, 14, 30]);

export async function POST(req: NextRequest) {
  const { habitId, force } = await req.json();

  if (habitId == null) {
    return NextResponse.json({ error: "No habitId provided" }, { status: 400 });
  }

  const result = logHabit(habitId, force === true);

  if (result.alreadyLogged) {
    return NextResponse.json({ alreadyLogged: true, streak: result.streak });
  }

  const { streak, missedYesterday = false } = result;
  const latest = getLatestGeneration(habitId);

  if (!TITLE_MILESTONES.has(streak) && !missedYesterday) {
    return NextResponse.json({
      streak,
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
    missedYesterday,
    title,
    bgImagePath: latest?.bg_image_path ?? null,
  });
}
