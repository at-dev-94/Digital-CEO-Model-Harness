import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettingsMap, setSetting } from "@/lib/settings";
import { audit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({ settings: await getSettingsMap() });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = (await req.json()) as Record<string, string>;
    const allowed = [
      "executionMode",
      "autoMode",
      "companyName",
      "language",
      "postsPerDay",
      "approvalRequired",
      "assistantName",
      "readAloud",
      "wakeWord",
      "voiceRate",
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) await setSetting(key, String(body[key]));
    }
    if (body.language === "en" || body.language === "bn") {
      await prisma.user.update({ where: { id: user.id }, data: { language: body.language } });
    }
    await audit({
      userId: user.id,
      action: "update_settings",
      entity: "Setting",
      detail: JSON.stringify(body),
    });
    return NextResponse.json({ settings: await getSettingsMap() });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
