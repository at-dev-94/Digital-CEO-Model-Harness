import { NextResponse } from "next/server";
import { errorResponse, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettingsMap } from "@/lib/settings";

function startOfDayUtc(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function percentChange(current: number, previous: number) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function GET() {
  try {
    await requireSession();

    const windowStart = startOfDayUtc(6);
    const priorStart = startOfDayUtc(13);
    const dayKeys = Array.from({ length: 7 }, (_, i) => startOfDayUtc(6 - i));

    const [metrics, orders, priorOrders, websites, posts, activity, jobs, prices, recs, settings, pendingCount] =
      await Promise.all([
        prisma.metricDaily.findMany({ where: { date: { gte: priorStart } } }),
        prisma.order.findMany({ where: { placedAt: { gte: windowStart } }, orderBy: { placedAt: "asc" } }),
        prisma.order.findMany({ where: { placedAt: { gte: priorStart, lt: windowStart } } }),
        prisma.website.findMany({ orderBy: { createdAt: "asc" } }),
        prisma.socialPost.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
        prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
        prisma.jobRun.findMany({ orderBy: { startedAt: "desc" }, take: 6 }),
        prisma.competitorPrice.findMany({ orderBy: { scrapedAt: "desc" }, take: 60 }),
        prisma.priceRecommendation.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
        getSettingsMap(),
        prisma.approval.count({ where: { status: "pending" } }),
      ]);

    const metricTotal = (key: string, from: Date, to?: Date) =>
      metrics
        .filter((m) => m.key === key && m.date >= from && (!to || m.date < to))
        .reduce((sum, m) => sum + m.value, 0);

    const salesCurrent = orders.reduce((sum, o) => sum + o.amountUsd, 0);
    const salesPrior = priorOrders.reduce((sum, o) => sum + o.amountUsd, 0);

    const series = dayKeys.map((day) => {
      const next = new Date(day);
      next.setUTCDate(next.getUTCDate() + 1);
      const dayOrders = orders.filter((o) => o.placedAt >= day && o.placedAt < next);
      return {
        date: day.toISOString(),
        revenue: Math.round(dayOrders.reduce((sum, o) => sum + o.amountUsd, 0) * 100) / 100,
        orders: dayOrders.length,
        visits: metricTotal("website_visits", day, next),
      };
    });

    const providers = new Set(prices.map((p) => p.provider));
    const lastScan = prices[0]?.scrapedAt ?? null;
    const draftPosts = await prisma.socialPost.count({ where: { status: { in: ["draft", "pending"] } } });

    return NextResponse.json({
      stats: {
        visits: {
          value: metricTotal("website_visits", windowStart),
          change: percentChange(metricTotal("website_visits", windowStart), metricTotal("website_visits", priorStart, windowStart)),
        },
        reach: {
          value: metricTotal("social_reach", windowStart),
          change: percentChange(metricTotal("social_reach", windowStart), metricTotal("social_reach", priorStart, windowStart)),
        },
        emails: {
          value: metricTotal("emails_processed", windowStart),
          change: percentChange(metricTotal("emails_processed", windowStart), metricTotal("emails_processed", priorStart, windowStart)),
        },
        sales: {
          value: Math.round(salesCurrent * 100) / 100,
          change: percentChange(salesCurrent, salesPrior),
          orders: orders.length,
        },
      },
      series,
      websites,
      posts: posts.map((p) => ({
        id: p.id,
        platform: p.platform,
        caption: p.caption,
        status: p.status,
        scheduledAt: p.scheduledAt,
        publishedAt: p.publishedAt,
      })),
      activity: activity.map((a) => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        detail: a.detail,
        createdAt: a.createdAt,
      })),
      jobs,
      market: {
        providerCount: providers.size,
        priceCount: prices.length,
        lastScan,
        topRecommendation: recs[0] || null,
        recommendationCount: recs.length,
      },
      content: { draftPosts },
      autopilot: settings.executionMode === "auto" || settings.autoMode === "true",
      pendingApprovals: pendingCount,
      assistantName: settings.assistantName || "Nova",
    });
  } catch (err) {
    const { body, status } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
