import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeCompetitors } from "@/lib/scrape";
import { buildMorningBrief } from "@/lib/brief";
import { generateDailyPosts } from "@/lib/social";
import { enqueueApproval } from "@/lib/approvals";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { checkWebsites } from "@/lib/websites";

function dayKey(input?: unknown) {
  const d = input ? new Date(String(input)) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function authorized(req: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET || "";
  const header = req.headers.get("x-webhook-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  return Boolean(secret) && header === secret;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "n8n";
  const limited = rateLimit(`webhook:${ip}`, 120, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "rate limit" }, { status: 429 });
  if (!authorized(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json()) as {
    event?: string;
    payload?: Record<string, unknown>;
    language?: "en" | "bn";
  };
  const event = body.event || "ping";
  const owner = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!owner) return NextResponse.json({ error: "not seeded" }, { status: 500 });

  let result: unknown = { ok: true };
  if (event === "competitor.scan") result = await scrapeCompetitors();
  else if (event === "brief.generate") result = await buildMorningBrief(body.language || "en");
  else if (event === "social.generate") result = await generateDailyPosts(owner.id, String(body.payload?.topic || ""));
  else if (event === "email.ingest") {
    const p = body.payload || {};
    const email = await prisma.emailItem.create({
      data: {
        fromName: String(p.fromName || "Unknown"),
        fromEmail: String(p.fromEmail || "unknown@example.com"),
        subject: String(p.subject || "(no subject)"),
        body: String(p.body || ""),
        priority: String(p.priority || "normal"),
        status: "unread",
      },
    });
    if (email.priority === "urgent") {
      await enqueueApproval({
        userId: owner.id,
        type: "email",
        title: `Urgent: ${email.subject}`,
        summary: email.body.slice(0, 400),
        payload: { emailId: email.id },
        risk: "high",
        channel: "email",
      });
    }
    result = email;
  } else if (event === "calendar.upsert") {
    const p = body.payload || {};
    result = await prisma.calendarEvent.create({
      data: {
        title: String(p.title || "Untitled"),
        description: p.description ? String(p.description) : null,
        location: p.location ? String(p.location) : null,
        startAt: new Date(String(p.startAt || new Date().toISOString())),
        endAt: new Date(String(p.endAt || new Date().toISOString())),
        attendees: p.attendees ? String(p.attendees) : null,
        source: "caldav",
        prepNote: p.prepNote ? String(p.prepNote) : null,
      },
    });
  } else if (event === "order.create") {
    const p = body.payload || {};
    const externalId = p.externalId ? String(p.externalId) : null;
    const data = {
      planName: String(p.planName || "eSIM plan"),
      country: String(p.country || "Unknown"),
      dataGb: Number(p.dataGb || 0),
      days: Number(p.days || 0),
      amountUsd: Number(p.amountUsd || 0),
      currency: String(p.currency || "USD"),
      channel: String(p.channel || "web"),
      status: String(p.status || "paid"),
      customer: p.customer ? String(p.customer) : null,
      placedAt: p.placedAt ? new Date(String(p.placedAt)) : new Date(),
    };
    result = externalId
      ? await prisma.order.upsert({ where: { externalId }, update: data, create: { externalId, ...data } })
      : await prisma.order.create({ data });
  } else if (event === "metric.upsert") {
    const p = body.payload || {};
    const key = String(p.key || "website_visits");
    const date = dayKey(p.date);
    const value = Number(p.value || 0);
    result = await prisma.metricDaily.upsert({
      where: { key_date: { key, date } },
      update: { value, source: String(p.source || "n8n") },
      create: { key, date, value, source: String(p.source || "n8n") },
    });
  } else if (event === "website.check") {
    result = await checkWebsites();
  }

  await audit({
    userId: owner.id,
    action: `webhook:${event}`,
    entity: "Webhook",
    detail: JSON.stringify(body.payload || {}).slice(0, 500),
    ip,
  });

  return NextResponse.json({ event, result });
}
