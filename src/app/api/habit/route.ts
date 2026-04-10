import { NextRequest, NextResponse } from "next/server";
import { getHabit, getStreak, getLatestGeneration, deleteHabit } from "@/lib/db/actions";
import { generateTitle } from "@/lib/rules/titles";
import { HabitProfile } from "@/lib/rules/habits";

export async function DELETE(req: NextRequest) {
  const habitId = Number(req.nextUrl.searchParams.get("id"));
  if (!habitId) {
    return NextResponse.json({ error: "No habitId provided" }, { status: 400 });
  }
  deleteHabit(habitId);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const habitId = Number(req.nextUrl.searchParams.get("id"));
  if (!habitId) {
    return NextResponse.json({ error: "No habitId provided" }, { status: 400 });
  }

  const habit = getHabit(habitId);
  if (!habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  const streak = getStreak(habitId);
  const latest = getLatestGeneration(habitId);
  const profile: HabitProfile = {
    domain:      habit.domain,
    tone:        habit.tone,
    setting:     habit.setting,
    rewardStyle: habit.reward_style,
    keywords:    [],
    rawInput:    habit.raw_input,
  };

  const title = latest?.title ?? generateTitle(profile, streak.streak_count, streak.missed_yesterday === 1);

  return NextResponse.json({
    habitId,
    title,
    buttonLabel:     habit.button_label,
    bgImagePath:     latest?.bg_image_path ?? null,
    streak:          streak.streak_count,
    missedYesterday: streak.missed_yesterday === 1,
  });
}
