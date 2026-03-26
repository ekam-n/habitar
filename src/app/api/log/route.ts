import { NextRequest, NextResponse } from "next/server";
import { generateTitle } from "@/lib/rules/titles";
import { generateBackgroundPrompt, generateAccessoryPrompt } from "@/lib/rules/prompts";
import { generateBackgroundImage, generateAccessoryImage } from "@/lib/ai/imageService";
import { logHabit, getHabit, saveGeneration } from "@/lib/db/actions";
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
  const bgImagePath = await generateBackgroundImage(bgPrompt, habitId, streak); 
  const accessoryImagePath = await generateAccessoryImage(accessoryPrompt, habitId);
  
  saveGeneration({
    habitId,
    streakAtTime: streak,
    title,
    bgPrompt,
    accessoryPrompt,
    bgImagePath,
    accessoryImagePath,
  });

  return NextResponse.json({
    streak,
    missedYesterday,
    title,
    bgPrompt,
    accessoryPrompt,
    bgImagePath,
    accessoryImagePath,
  });
}