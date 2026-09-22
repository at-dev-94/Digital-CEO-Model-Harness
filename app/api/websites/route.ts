import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { checkWebsites } from "@/lib/websites";

export async function GET() {
  try {
    await requireSession();
    const websites = await prisma.website.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ websites });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = (await req.json().catch(() => ({}))) as { name?: string; url?: string; id?: string; action?: string };

    if (body.action === "delete" && body.id) {
      await prisma.website.delete({ where: { id: body.id } }).catch(() => null);
      const websites = await prisma.website.findMany({ orderBy: { createdAt: "asc" } });
      return NextResponse.json({ websites });
    }

    if (body.url) {
      const site = await prisma.website.upsert({
        where: { url: body.url },
        update: { name: body.name || body.url },
        create: { name: body.name || body.url, url: body.url },
      });
      await audit({ userId: user.id, action: "add_website", entity: "Website", entityId: site.id, detail: site.url });
    }

    const result = await checkWebsites();
    await audit({
      userId: user.id,
      action: "website_status_check",
      entity: "Website",
      detail: `${result.online} of ${result.checked} sites online`,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
