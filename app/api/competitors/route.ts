import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scrapeCompetitors } from "@/lib/scrape";

export async function GET() {
  try {
    await requireSession();
    const [prices, recs, jobs] = await Promise.all([
      prisma.competitorPrice.findMany({ orderBy: [{ country: "asc" }, { provider: "asc" }] }),
      prisma.priceRecommendation.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.jobRun.findMany({ where: { name: "competitor-scan" }, orderBy: { startedAt: "desc" }, take: 5 }),
    ]);
    return NextResponse.json({ prices, recs, jobs });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST() {
  try {
    await requireSession();
    const result = await scrapeCompetitors();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
