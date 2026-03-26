import { NextRequest, NextResponse } from "next/server";
import { resetStreak } from "@/lib/db/actions";

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true")
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  const { habitId } = await req.json();
  resetStreak(habitId);
  return NextResponse.json({ ok: true });
}
