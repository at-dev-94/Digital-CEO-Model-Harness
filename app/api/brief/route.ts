import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildMorningBrief } from "@/lib/brief";

export async function GET() {
  try {
    const user = await requireSession();
    const latest = await prisma.report.findFirst({
      where: { type: "morning_brief" },
      orderBy: { createdAt: "desc" },
    });
    const [emails, meetings, approvals, posts, recs] = await Promise.all([
      prisma.emailItem.findMany({ orderBy: { receivedAt: "desc" }, take: 8 }),
      prisma.calendarEvent.findMany({
        where: { startAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        orderBy: { startAt: "asc" },
        take: 6,
      }),
      prisma.approval.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" } }),
      prisma.socialPost.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
      prisma.priceRecommendation.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
    ]);
    return NextResponse.json({
      user,
      brief: latest,
      emails,
      meetings,
      approvals,
      posts,
      recs,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = (await req.json().catch(() => ({}))) as { language?: "en" | "bn" };
    const built = await buildMorningBrief(body.language || (user.language as "en" | "bn"));
    return NextResponse.json(built);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
