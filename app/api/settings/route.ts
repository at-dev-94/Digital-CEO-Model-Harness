import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPublicSettingsMap, SECRET_SETTING_KEYS, setSetting } from "@/lib/settings";
import { audit } from "@/lib/audit";

const ALLOWED = [
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
  "voicePreset",
  "avatarMode",
  "scrapeTargets",
  "gmailUser",
  "imapHost",
  "facebookUser",
  "instagramUser",
  "xUser",
  "tiktokUser",
  "caldavUser",
  "caldavUrl",
  ...SECRET_SETTING_KEYS,
];

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({ settings: await getPublicSettingsMap() });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = (await req.json()) as Record<string, string>;
    const saved: string[] = [];
    for (const key of ALLOWED) {
      if (body[key] === undefined) continue;
      const value = String(body[key]);
      if ((SECRET_SETTING_KEYS as readonly string[]).includes(key) && value.trim() === "") continue;
      await setSetting(key, value);
      saved.push(key);
    }
    if (body.language === "en" || body.language === "bn") {
      await prisma.user.update({ where: { id: user.id }, data: { language: body.language } });
    }
    await audit({
      userId: user.id,
      action: "update_settings",
      entity: "Setting",
      detail: saved.filter((k) => !(SECRET_SETTING_KEYS as readonly string[]).includes(k)).join(", "),
    });
    return NextResponse.json({ settings: await getPublicSettingsMap() });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
