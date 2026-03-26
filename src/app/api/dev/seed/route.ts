import { NextResponse } from "next/server";
import { getOrCreateDevHabit } from "@/lib/db/actions";

export async function GET() {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }
  const habitId = getOrCreateDevHabit();
  return NextResponse.json({ habitId });
}
