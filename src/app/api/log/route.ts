import { NextRequest, NextResponse } from "next/server";
import { generateTitle } from "@/lib/rules/titles";
import { generateBackgroundPrompt } from "@/lib/rules/prompts";
import { generateBackgroundImage } from "@/lib/ai/imageService";
import { logHabit, getHabit, saveGeneration, getLatestGeneration } from "@/lib/db/actions";
import { HabitProfile } from "@/lib/rules/habits";

const GENERATION_MILESTONES = new Set([1, 3, 7, 14, 30]);

export async function POST(req: NextRequest) {
  const { habitId, force, skipGeneration } = await req.json();

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

  if (skipGeneration || !GENERATION_MILESTONES.has(streak)) {
    const latest = getLatestGeneration(habitId);
    return NextResponse.json({
      streak,
      missedYesterday,
      title,
      bgImagePath: latest?.bg_image_path ?? null,
    });
  }

  const bgPrompt = generateBackgroundPrompt(profile, streak, missedYesterday);
  const bgImagePath = await generateBackgroundImage(bgPrompt, habitId, streak);

  saveGeneration({ habitId, streakAtTime: streak, title, bgPrompt, bgImagePath });

  return NextResponse.json({ streak, missedYesterday, title, bgPrompt, bgImagePath });
}
