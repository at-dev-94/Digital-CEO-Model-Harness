import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getSettingsMap } from "@/lib/settings";

export async function GET() {
  try {
    const user = await requireSession();
    const settings = await getSettingsMap();
    return NextResponse.json({ user, settings });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
