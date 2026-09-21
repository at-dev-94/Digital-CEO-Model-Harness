import { prisma } from "./db";
import { runHarness } from "./harness";
import { getSetting } from "./settings";

export async function buildMorningBrief(language: "en" | "bn" = "en") {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const [emails, meetings, approvals, posts, recs, company] = await Promise.all([
    prisma.emailItem.findMany({
      where: { priority: { in: ["urgent", "high"] } },
      orderBy: { receivedAt: "desc" },
      take: 6,
    }),
    prisma.calendarEvent.findMany({
      where: { startAt: { gte: start, lte: end } },
      orderBy: { startAt: "asc" },
    }),
    prisma.approval.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.socialPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.priceRecommendation.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    getSetting("companyName"),
  ]);

  const facts = {
    company,
    date: now.toISOString(),
    urgentEmailCount: emails.filter((e) => e.priority === "urgent").length,
    meetingCount: meetings.length,
    pendingApprovals: approvals.length,
    draftPosts: posts.filter((p) => ["draft", "pending", "scheduled"].includes(p.status)).length,
    emails: emails.map((e) => ({
      from: e.fromName,
      subject: e.subject,
      priority: e.priority,
      status: e.status,
    })),
    meetings: meetings.map((m) => ({
      title: m.title,
      startAt: m.startAt,
      prepNote: m.prepNote,
    })),
    approvals: approvals.map((a) => ({ title: a.title, type: a.type, risk: a.risk })),
    recommendations: recs.map((r) => ({
      country: r.country,
      suggestedUsd: r.suggestedUsd,
      competitorMin: r.competitorMin,
    })),
  };

  const { text, model } = await runHarness({
    kind: "brief",
    language,
    messages: [
      {
        role: "user",
        content: `Write today's Morning Brief as a Digital CEO. Use only these facts (JSON):\n${JSON.stringify(facts)}\nStructure: 1) headline priorities 2) meetings & what to discuss 3) emails to handle 4) pricing moves 5) social to approve. Keep it under 350 words.`,
      },
    ],
  });

  const report = await prisma.report.create({
    data: {
      type: "morning_brief",
      title: language === "bn" ? "আজকের মর্নিং ব্রিফ" : "Morning Brief",
      content: text,
      language,
    },
  });

  return { report, emails, meetings, approvals, posts, recs, model, company };
}
