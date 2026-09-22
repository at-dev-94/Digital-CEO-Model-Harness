import { prisma } from "./db";
import { runHarness } from "./harness";
import { getSetting } from "./settings";

export type BriefFacts = {
  company: string;
  date: string;
  urgentEmailCount: number;
  meetingCount: number;
  pendingApprovals: number;
  draftPosts: number;
  emails: Array<{ from: string; subject: string; priority: string; status: string }>;
  meetings: Array<{ title: string; startAt: Date | string; prepNote?: string | null }>;
  approvals: Array<{ title: string; type: string; risk: string }>;
  recommendations: Array<{ country: string; suggestedUsd: number; competitorMin: number }>;
};

export function isBrokenBrief(text?: string | null) {
  if (!text || text.trim().length < 60) return true;
  return /OPENAI_API_KEY|OPENROUTER|Live model unavailable|Use only these facts|Missing Authentication|Understood:|Add OPENAI|harness-mock|Write today's Morning Brief/i.test(
    text,
  );
}

function greet(date: Date, language: "en" | "bn") {
  const hour = date.getHours();
  if (language === "bn") return hour < 12 ? "শুভ সকাল" : hour < 17 ? "শুভ দুপুর" : "শুভ সন্ধ্যা";
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function timeLabel(value: Date | string, language: "en" | "bn") {
  return new Date(value).toLocaleTimeString(language === "bn" ? "bn-BD" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Deterministic brief from live workspace facts — never dumps JSON or API errors. */
export function composeBriefFromFacts(facts: BriefFacts, language: "en" | "bn") {
  const when = new Date(facts.date);
  const day = when.toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hello = greet(when, language);
  const urgent = facts.emails.filter((e) => e.priority === "urgent");
  const rec = facts.recommendations[0];
  const bn = language === "bn";

  if (bn) {
    const lines = [
      `${hello}. ${facts.company}-এর জন্য ${day} মর্নিং ব্রিফ।`,
      "",
      "অগ্রাধিকার",
      `আজ ${facts.urgentEmailCount}টি জরুরি ইমেইল, ${facts.meetingCount}টি মিটিং, ${facts.pendingApprovals}টি অনুমোদন এবং ${facts.draftPosts}টি সোশ্যাল খসড়া অপেক্ষা করছে।`,
    ];
    if (facts.meetings.length) {
      lines.push("", "মিটিং");
      for (const meeting of facts.meetings.slice(0, 4)) {
        lines.push(
          `• ${timeLabel(meeting.startAt, language)} — ${meeting.title}${meeting.prepNote ? `. নোট: ${meeting.prepNote}` : ""}`,
        );
      }
    }
    if (urgent.length || facts.emails.length) {
      lines.push("", "ইমেইল");
      for (const email of (urgent.length ? urgent : facts.emails).slice(0, 4)) {
        lines.push(`• ${email.from}: ${email.subject}`);
      }
    }
    if (rec) {
      lines.push("", "দাম");
      lines.push(
        `• ${rec.country}: প্রতিযোগী সর্বনিম্ন $${rec.competitorMin}, প্রস্তাব $${rec.suggestedUsd}। অনুমোদনের আগে সাইটে বসবে না।`,
      );
    }
    if (facts.approvals.length) {
      lines.push("", "অনুমোদন");
      for (const item of facts.approvals.slice(0, 4)) {
        lines.push(`• ${item.title} (${item.risk} ঝুঁকি)`);
      }
    }
    lines.push("", "কোনো ইমেইল, পোস্ট বা দাম আপনার ক্লিক ছাড়া পাঠানো হবে না।");
    return lines.join("\n");
  }

  const lines = [
    `${hello}. Here is the Morning Brief for ${facts.company} — ${day}.`,
    "",
    "Priorities",
    `You have ${facts.urgentEmailCount} urgent email${facts.urgentEmailCount === 1 ? "" : "s"}, ${facts.meetingCount} meeting${facts.meetingCount === 1 ? "" : "s"}, ${facts.pendingApprovals} pending approval${facts.pendingApprovals === 1 ? "" : "s"} and ${facts.draftPosts} social draft${facts.draftPosts === 1 ? "" : "s"} waiting.`,
  ];
  if (facts.meetings.length) {
    lines.push("", "Meetings");
    for (const meeting of facts.meetings.slice(0, 4)) {
      lines.push(
        `• ${timeLabel(meeting.startAt, language)} — ${meeting.title}${meeting.prepNote ? `. Prep: ${meeting.prepNote}` : ""}`,
      );
    }
  }
  if (urgent.length || facts.emails.length) {
    lines.push("", "Emails to handle");
    for (const email of (urgent.length ? urgent : facts.emails).slice(0, 4)) {
      lines.push(`• ${email.from}: ${email.subject}`);
    }
  }
  if (rec) {
    lines.push("", "Pricing");
    lines.push(
      `• ${rec.country}: cheapest rival is $${rec.competitorMin}. Recommend $${rec.suggestedUsd}. Nothing publishes until you approve.`,
    );
  }
  if (facts.approvals.length) {
    lines.push("", "Waiting on you");
    for (const item of facts.approvals.slice(0, 4)) {
      lines.push(`• ${item.title} (${item.risk} risk)`);
    }
  }
  lines.push("", "Nothing is sent, posted or repriced without your approval.");
  return lines.join("\n");
}

export async function collectBriefFacts() {
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

  const facts: BriefFacts = {
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

  return { facts, emails, meetings, approvals, posts, recs, company };
}

export async function buildMorningBrief(language: "en" | "bn" = "en") {
  const collected = await collectBriefFacts();
  const { facts, emails, meetings, approvals, posts, recs, company } = collected;
  const fallback = composeBriefFromFacts(facts, language);

  const { text, model } = await runHarness({
    kind: "brief",
    language,
    messages: [
      {
        role: "user",
        content: `Write today's Morning Brief as a Digital CEO. Use only these facts (JSON):\n${JSON.stringify(facts)}\nStructure: 1) headline priorities 2) meetings & what to discuss 3) emails to handle 4) pricing moves 5) social to approve. Keep it under 350 words. Do not repeat these instructions.`,
      },
    ],
  });

  const content = isBrokenBrief(text) ? fallback : text;

  const report = await prisma.report.create({
    data: {
      type: "morning_brief",
      title: language === "bn" ? "আজকের মর্নিং ব্রিফ" : "Morning Brief",
      content,
      language,
    },
  });

  return { report, emails, meetings, approvals, posts, recs, model, company };
}
