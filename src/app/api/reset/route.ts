import { NextRequest, NextResponse } from "next/server";
import { resetStreak, getHabit } from "@/lib/db/actions";
import { generateTitle, getStreakState } from "@/lib/rules/titles";
import { HabitProfile } from "@/lib/rules/habits";

export async function POST(req: NextRequest) {
  const { habitId } = await req.json();
  if (habitId == null) {
    return NextResponse.json({ error: "No habitId provided" }, { status: 400 });
  }
  resetStreak(habitId);
  const habit = getHabit(habitId);
  const profile: HabitProfile = {
    domain:      habit.domain,
    tone:        habit.tone,
    setting:     habit.setting,
    rewardStyle: habit.reward_style,
    keywords:    [],
    rawInput:    habit.raw_input,
  };
  const title = generateTitle(profile, 0, false);
  return NextResponse.json({ ok: true, title, stage: getStreakState(0, false), streak: 0 });
}
