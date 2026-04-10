import { NextRequest, NextResponse } from "next/server";
import { generateTitle } from "@/lib/rules/titles";
import { logHabit, getHabit, getLatestGeneration } from "@/lib/db/actions";
import { HabitProfile } from "@/lib/rules/habits";

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
  const latest = getLatestGeneration(habitId);

  return NextResponse.json({
    streak,
    missedYesterday,
    title,
    bgImagePath: latest?.bg_image_path ?? null,
  });
}
