import { NextResponse } from "next/server";
import { getOrCreateDevHabit } from "@/lib/db/actions";

export async function GET() {
  try {
    if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
      return NextResponse.json({ error: "Not available" }, { status: 403 });
    }
    const habitId = getOrCreateDevHabit();
    return NextResponse.json({ habitId });
  } catch (err) {
    console.error("[/api/dev/seed]", err);
    return NextResponse.json({ error: "Could not seed a dev habit." }, { status: 500 });
  }
}
