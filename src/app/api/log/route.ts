import { NextRequest, NextResponse } from "next/server";
import { generateTitle } from "@/lib/rules/titles";
import { generateBackgroundPrompt, generateAccessoryPrompt } from "@/lib/rules/prompts";
import { logHabit, getHabit, saveGeneration } from "@/lib/db/actions";
import { HabitProfile } from "@/lib/rules/habits";

export async function POST(req: NextRequest) {
  const { habitId } = await req.json();

  if (!habitId) {
    return NextResponse.json({ error: "No habitId provided" }, { status: 400 });
  }

  const result = logHabit(habitId);

  if (result.alreadyLogged) {
    return NextResponse.json({ alreadyLogged: true, streak: result.streak });
  }

  const habit = getHabit(habitId);

  // Reconstruct profile from stored habit row
  const profile: HabitProfile = {
    domain:      habit.domain,
    tone:        habit.tone,
    setting:     habit.setting,
    rewardStyle: habit.reward_style,
    keywords:    [],
    rawInput:    habit.raw_input,
  };

  const { streak, missedYesterday = false } = result;
  const title = generateTitle(profile, streak, missedYesterday);
  const bgPrompt = generateBackgroundPrompt(profile, streak, missedYesterday);
  const accessoryPrompt = generateAccessoryPrompt(profile);

  saveGeneration({
    habitId,
    streakAtTime: streak,
    title,
    bgPrompt,
    accessoryPrompt,
  });

  return NextResponse.json({
    streak,
    missedYesterday,
    title,
    bgPrompt,
    accessoryPrompt,
  });
}