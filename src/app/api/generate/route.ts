import { NextRequest, NextResponse } from "next/server";
import { parseHabit } from "@/lib/rules/habits";
import { generateTitle, generateButtonLabel, getStreakState } from "@/lib/rules/titles";
import { generateBackgroundPrompt } from "@/lib/rules/prompts";
import { createHabit, saveGeneration } from "@/lib/db/actions";
import { generateBackgroundImage } from "@/lib/ai/imageService";

export async function POST(req: NextRequest) {
  const { habitInput } = await req.json();

  if (!habitInput || habitInput.trim().length === 0) {
    return NextResponse.json({ error: "No habit input provided" }, { status: 400 });
  }

  const profile = parseHabit(habitInput);
  const buttonLabel = generateButtonLabel(profile);
  const title = generateTitle(profile, 0, false);
  const stage = getStreakState(0, false);
  const bgPrompt = generateBackgroundPrompt(profile, 0, false);

  const habitId = createHabit(profile, buttonLabel);

  const bgImagePath = await generateBackgroundImage(bgPrompt, habitId, 0);

  saveGeneration({ habitId, streakAtTime: 0, title, bgPrompt, bgImagePath });

  return NextResponse.json({ habitId, profile, title, stage, buttonLabel, bgImagePath });
}
