import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { ensureClientSettings } from "@/lib/settings";

export async function GET() {
  try {
    const user = await requireSession();
    const settings = await ensureClientSettings();
    return NextResponse.json({ user, settings });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
