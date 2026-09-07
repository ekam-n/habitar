import { NextRequest, NextResponse } from "next/server";
import { parseHabit } from "@/lib/rules/habits";
import { generateTitle, generateButtonLabel, getStreakState } from "@/lib/rules/titles";
import { generateBackgroundPrompt } from "@/lib/rules/prompts";
import { createHabit, saveGeneration, deleteHabit } from "@/lib/db/actions";
import { generateBackgroundImage } from "@/lib/ai/imageService";

export async function POST(req: NextRequest) {
  let habitId: number | null = null;

  try {
    const { habitInput } = await req.json();

    if (!habitInput || habitInput.trim().length === 0) {
      return NextResponse.json({ error: "No habit input provided" }, { status: 400 });
    }

    const profile = parseHabit(habitInput);
    const buttonLabel = generateButtonLabel(profile);
    const title = generateTitle(profile, 0, false);
    const stage = getStreakState(0, false);
    const bgPrompt = generateBackgroundPrompt(profile, 0, false);

    habitId = createHabit(profile, buttonLabel);

    const bgImagePath = await generateBackgroundImage(bgPrompt, habitId, 0);

    saveGeneration({ habitId, streakAtTime: 0, title, bgPrompt, bgImagePath });

    return NextResponse.json({
      habitId,
      profile,
      title,
      stage,
      buttonLabel,
      bgImagePath,
      // Appearance is chosen in a later onboarding step; not picked yet.
      characterId:      null,
      characterVariant: null,
    });
  } catch (err) {
    // The habit row is written before generation, so a generation failure
    // would otherwise leave an orphaned habit with no generation row behind
    // on every retry.
    if (habitId !== null) {
      try {
        deleteHabit(habitId);
      } catch {
        // best effort; the original error below is the one worth reporting
      }
    }

    console.error("[/api/generate]", err);
    return NextResponse.json(
      {
        error:
          "Could not generate your world. Check that ComfyUI is running at " +
          `${process.env.COMFY_URL ?? "http://127.0.0.1:8188"} and try again.`,
      },
      { status: 502 },
    );
  }
}
