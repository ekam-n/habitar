import { NextRequest, NextResponse } from "next/server";
import { getHabit, getStreak, getLatestGeneration, deleteHabit, getHabitAppearance } from "@/lib/db/actions";
import { generateTitle, getStreakState } from "@/lib/rules/titles";
import { HabitProfile } from "@/lib/rules/habits";

export async function DELETE(req: NextRequest) {
  try {
    const habitId = Number(req.nextUrl.searchParams.get("id"));
    if (!habitId) {
      return NextResponse.json({ error: "No habitId provided" }, { status: 400 });
    }
    deleteHabit(habitId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/habit DELETE]", err);
    return NextResponse.json({ error: "Could not delete this habit." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const habitId = Number(req.nextUrl.searchParams.get("id"));
    if (!habitId) {
      return NextResponse.json({ error: "No habitId provided" }, { status: 400 });
    }

    const habit = getHabit(habitId);
    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const streak = getStreak(habitId);
    if (!streak) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const latest = getLatestGeneration(habitId);
    const profile: HabitProfile = {
      domain:      habit.domain,
      tone:        habit.tone,
      setting:     habit.setting,
      rewardStyle: habit.reward_style,
      keywords:    [],
      rawInput:    habit.raw_input,
    };

    const missedYesterday = streak.missed_yesterday === 1;
    const title = latest?.title ?? generateTitle(profile, streak.streak_count, missedYesterday);
    const stage = getStreakState(streak.streak_count, missedYesterday);
    const appearance = getHabitAppearance(habitId);

    return NextResponse.json({
      habitId,
      title,
      stage,
      characterId:      appearance?.characterId ?? null,
      characterVariant: appearance?.characterVariant ?? null,
      buttonLabel:      habit.button_label,
      bgImagePath:      latest?.bg_image_path ?? null,
      streak:           streak.streak_count,
      missedYesterday,
    });
  } catch (err) {
    console.error("[/api/habit GET]", err);
    return NextResponse.json({ error: "Could not load your habit." }, { status: 500 });
  }
}
