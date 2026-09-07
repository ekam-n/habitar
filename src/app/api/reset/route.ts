import { NextRequest, NextResponse } from "next/server";
import { resetStreak, getHabit } from "@/lib/db/actions";
import { generateTitle, getStreakState } from "@/lib/rules/titles";
import { HabitProfile } from "@/lib/rules/habits";

export async function POST(req: NextRequest) {
  try {
    const { habitId } = await req.json();
    if (habitId == null) {
      return NextResponse.json({ error: "No habitId provided" }, { status: 400 });
    }

    const habit = getHabit(habitId);
    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    resetStreak(habitId);

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
  } catch (err) {
    console.error("[/api/reset]", err);
    return NextResponse.json({ error: "Could not reset your streak." }, { status: 500 });
  }
}
