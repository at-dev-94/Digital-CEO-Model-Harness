import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function at(hours: number, minutes = 0) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function dayStart(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.competitorPrice.deleteMany();
  await prisma.priceRecommendation.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.emailItem.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.report.deleteMany();
  await prisma.businessDoc.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.jobRun.deleteMany();
  await prisma.order.deleteMany();
  await prisma.website.deleteMany();
  await prisma.metricDaily.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(process.env.SEED_USER_PASSWORD || "ChangeMe!CEO2026", 12);
  const user = await prisma.user.create({
    data: {
      email: process.env.SEED_USER_EMAIL || "eshmum@digitalceo.local",
      passwordHash,
      name: "Eshmum",
      role: "owner",
      language: "en",
    },
  });

  await prisma.setting.createMany({
    data: [
      { key: "executionMode", value: "manual" },
      { key: "autoMode", value: "false" },
      { key: "companyName", value: process.env.COMPANY_NAME || "247eSIM" },
      { key: "language", value: "en" },
      { key: "postsPerDay", value: "4" },
      { key: "approvalRequired", value: "true" },
      { key: "assistantName", value: process.env.ASSISTANT_NAME || "Nova" },
      { key: "readAloud", value: "true" },
      { key: "wakeWord", value: "false" },
      { key: "voiceRate", value: "1" },
      { key: "voicePreset", value: "en-GB-male" },
      { key: "avatarMode", value: "photo" },
      {
        key: "scrapeTargets",
        value: JSON.stringify([
          { name: "Airalo", url: "https://www.airalo.com/united-states-esim", country: "United States", countryCode: "US" },
          { name: "Airalo Turkey", url: "https://www.airalo.com/turkey-esim", country: "Turkey", countryCode: "TR" },
          { name: "Saily", url: "https://saily.com", country: "United States", countryCode: "US" },
          { name: "Nomad", url: "https://www.nomadesim.com", country: "United States", countryCode: "US" },
          { name: "Holafly", url: "https://esim.holafly.com", country: "Europe", countryCode: "EU" },
        ]),
      },
    ],
  });

  const prices = [
    ["Airalo", "United States", "US", "10GB / 30 days", 10, 30, 22.5, "https://www.airalo.com/united-states-esim"],
    ["Saily", "United States", "US", "10GB / 30 days", 10, 30, 22.99, "https://saily.com"],
    ["Nomad", "United States", "US", "10GB / 30 days", 10, 30, 20.0, "https://www.nomadesim.com"],
    ["Airalo", "United Kingdom", "GB", "3GB / 30 days", 3, 30, 9.5, "https://www.airalo.com/united-kingdom-esim"],
    ["Saily", "United Kingdom", "GB", "3GB / 30 days", 3, 30, 8.99, "https://saily.com"],
    ["Nomad", "United Kingdom", "GB", "3GB / 30 days", 3, 30, 9.0, "https://www.nomadesim.com"],
    ["Airalo", "Turkey", "TR", "10GB / 30 days", 10, 30, 16.0, "https://www.airalo.com/turkey-esim"],
    ["Saily", "Turkey", "TR", "10GB / 30 days", 10, 30, 15.0, "https://saily.com"],
    ["Nomad", "Turkey", "TR", "10GB / 30 days", 10, 30, 15.5, "https://www.nomadesim.com"],
    ["Airalo", "Japan", "JP", "10GB / 30 days", 10, 30, 18.0, "https://www.airalo.com/japan-esim"],
    ["Saily", "Japan", "JP", "10GB / 30 days", 10, 30, 17.99, "https://saily.com"],
    ["Nomad", "Japan", "JP", "10GB / 30 days", 10, 30, 17.0, "https://www.nomadesim.com"],
    ["Airalo", "Europe", "EU", "10GB / 30 days", 10, 30, 31.0, "https://www.airalo.com"],
    ["Saily", "Europe", "EU", "10GB / 30 days", 10, 30, 35.99, "https://saily.com"],
    ["Nomad", "Europe", "EU", "10GB / 30 days", 10, 30, 23.0, "https://www.nomadesim.com"],
    ["Airalo", "United Arab Emirates", "AE", "5GB / 30 days", 5, 30, 16.0, "https://www.airalo.com"],
    ["Saily", "United Arab Emirates", "AE", "5GB / 30 days", 5, 30, 15.99, "https://saily.com"],
    ["Nomad", "United Arab Emirates", "AE", "5GB / 30 days", 5, 30, 16.5, "https://www.nomadesim.com"],
    ["Airalo", "Bangladesh", "BD", "3GB / 30 days", 3, 30, 8.5, "https://www.airalo.com"],
    ["Saily", "Bangladesh", "BD", "3GB / 30 days", 3, 30, 8.99, "https://saily.com"],
    ["Nomad", "Bangladesh", "BD", "3GB / 30 days", 3, 30, 9.5, "https://www.nomadesim.com"],
    ["247eSIM", "United States", "US", "10GB / 30 days", 10, 30, 18.4, "https://247esim.com"],
    ["247eSIM", "United Kingdom", "GB", "3GB / 30 days", 3, 30, 8.27, "https://247esim.com"],
    ["247eSIM", "Turkey", "TR", "10GB / 30 days", 10, 30, 13.8, "https://247esim.com"],
    ["247eSIM", "Japan", "JP", "10GB / 30 days", 10, 30, 16.5, "https://247esim.com"],
    ["247eSIM", "Europe", "EU", "10GB / 30 days", 10, 30, 21.16, "https://247esim.com"],
    ["247eSIM", "United Arab Emirates", "AE", "5GB / 30 days", 5, 30, 16.5, "https://247esim.com"],
    ["247eSIM", "Bangladesh", "BD", "3GB / 30 days", 3, 30, 7.82, "https://247esim.com"],
  ] as const;

  await prisma.competitorPrice.createMany({
    data: prices.map((p) => ({
      provider: p[0],
      country: p[1],
      countryCode: p[2],
      planName: p[3],
      dataGb: p[4],
      days: p[5],
      priceUsd: p[6],
      url: p[7],
      source: p[0] === "247eSIM" ? "own-catalog" : "catalog",
    })),
  });

  await prisma.priceRecommendation.createMany({
    data: [
      {
        country: "United States",
        planName: "10GB / 30 days",
        dataGb: 10,
        days: 30,
        suggestedUsd: 18.4,
        competitorAvg: 21.83,
        competitorMin: 20,
        rationale:
          "Nomad is cheapest at $20. Price at $18.40 (8% under) and lead with AT&T/T-Mobile coverage copy plus a UK/BD diaspora landing page.",
      },
      {
        country: "Turkey",
        planName: "10GB / 30 days",
        dataGb: 10,
        days: 30,
        suggestedUsd: 13.8,
        competitorAvg: 15.5,
        competitorMin: 15,
        rationale:
          "Saily leads at $15. Match tourists searching 'Istanbul eSIM' and win on Bangla/English support plus WhatsApp delivery.",
      },
      {
        country: "Europe",
        planName: "10GB / 30 days",
        dataGb: 10,
        days: 30,
        suggestedUsd: 21.16,
        competitorAvg: 30,
        competitorMin: 23,
        rationale:
          "Nomad undercuts Airalo/Saily hard. $21.16 keeps you cheapest without looking like a grey-market SIM.",
      },
    ],
  });

  const recUsa = await prisma.priceRecommendation.findFirst({ where: { country: "United States" } });
  const recTr = await prisma.priceRecommendation.findFirst({ where: { country: "Turkey" } });

  const posts = await Promise.all([
    prisma.socialPost.create({
      data: {
        platform: "instagram",
        caption: "Land in Istanbul with 5G before your bag hits the belt. 10GB Turkey eSIM from $13.80 — install on Wi-Fi at home.",
        captionBn: "ইস্তাম্বুলে নামার আগেই নেট চালু। তুরস্ক ১০GB ই-সিম মাত্র $১৩.৮০ — বাসায় ওয়াইফাইতে ইনস্টল করুন।",
        hashtags: "#TurkeyeSIM #IstanbulTravel #eSIM #RoamingFree",
        mediaPrompt: "Golden hour arrivals hall IST, phone screen with 5G, teal-gold grade",
        seoKeywords: "turkey esim, istanbul internet, travel esim turkey",
        geoTargets: "TR, GB, BD, DE",
        status: "pending",
        scheduledAt: at(11, 0),
      },
    }),
    prisma.socialPost.create({
      data: {
        platform: "facebook",
        caption: "UK to BD, BD to UK — stop paying £8/day roaming. Family eSIM bundles with Bangla support on WhatsApp.",
        captionBn: "যুক্তরাজ্য-বাংলাদেশ রোমিং বন্ধ করুন। পরিবারের জন্য ই-সিম, হোয়াটসঅ্যাপে বাংলা সাপোর্ট।",
        hashtags: "#UKeSIM #Bangladesh #Diaspora #TravelTech",
        mediaPrompt: "Split scene Heathrow + Dhaka, family on video call",
        seoKeywords: "uk esim, bangladesh roaming, cheap uk data",
        geoTargets: "GB, BD",
        status: "draft",
        scheduledAt: at(14, 0),
      },
    }),
    prisma.socialPost.create({
      data: {
        platform: "tiktok",
        caption: "POV: you skipped the airport SIM stall. 15-second install. USA 10GB $18.40.",
        captionBn: "এয়ারপোর্ট সিম স্টল স্কিপ। ১৫ সেকেন্ডে ইনস্টল। USA ১০GB $১৮.৪০।",
        hashtags: "#esimhack #traveltok #usaesim",
        mediaPrompt: "Fast cut: plane door, QR scan, maps open, skyline",
        seoKeywords: "usa esim, skip airport sim, travel hack 2026",
        geoTargets: "US, GB",
        status: "published",
        publishedAt: at(8, 30),
        impressions: 18420,
        likes: 961,
        comments: 74,
        shares: 188,
        clicks: 402,
      },
    }),
    prisma.socialPost.create({
      data: {
        platform: "instagram",
        caption: "Dubai layover? 5GB UAE eSIM ready before you leave the jetway. Compare us to Airalo & Saily in the bio.",
        captionBn: "দুবাই লেওভার? জেটওয়ে ছাড়ার আগেই UAE ৫GB ই-সিম রেডি।",
        hashtags: "#UAEeSIM #DubaiAirport #VisitDubai",
        mediaPrompt: "DXB concourse night, neon gold, phone hotspot",
        seoKeywords: "uae esim, dubai airport internet, gcc esim",
        geoTargets: "AE, SA, GB",
        status: "scheduled",
        scheduledAt: at(18, 0),
      },
    }),
  ]);

  await prisma.emailItem.createMany({
    data: [
      {
        fromName: "Sarah Collins",
        fromEmail: "sarah.collins@horizontravel.co.uk",
        subject: "Urgent: 200 corporate eSIMs for October US trip",
        body: "We need 200 USA 10GB SIMs by 28 Sep. Can you match Nomad’s $20 and invoice NET7? Contract attached in thread.",
        priority: "urgent",
        status: "unread",
        draftReply:
          "Sarah — yes, we can fulfil 200 × USA 10GB by 28 Sep at $18.40/line (volume). Draft invoice NET7 is ready for your approval before send.",
        receivedAt: at(7, 12),
      },
      {
        fromName: "Airport Retail Co",
        fromEmail: "ops@dxb-retail.example",
        subject: "Shelf space DXB T3 — need rate card today",
        body: "Can you send a one-pager vs Airalo for T3 kiosk? Decision meeting 16:00 GST.",
        priority: "urgent",
        status: "unread",
        draftReply:
          "Attaching a one-pager: 8% under Airalo Turkey/USA, Bangla+EN support, WhatsApp provisioning. Happy to join the 16:00 GST call.",
        receivedAt: at(8, 5),
      },
      {
        fromName: "OpenRouter billing",
        fromEmail: "billing@openrouter.ai",
        subject: "Usage digest",
        body: "Yesterday: $4.12 across Claude + DeepSeek. No action required.",
        priority: "low",
        status: "read",
        receivedAt: at(6, 40),
      },
      {
        fromName: "Imran Chowdhury",
        fromEmail: "imran@family.example",
        subject: "Mama arriving Gatwick Friday — which plan?",
        body: "She has an iPhone 13. 10 days UK. Bangla instructions please.",
        priority: "high",
        status: "unread",
        draftReply:
          "iPhone 13 is eSIM-ready. Recommend UK 3GB/30d at $8.27. I can send Bangla install screenshots after you approve this reply.",
        receivedAt: at(9, 20),
      },
    ],
  });

  await prisma.calendarEvent.createMany({
    data: [
      {
        title: "Supplier call — Turkey capacity",
        description: "Confirm September wholesale on Turkcell/Vodafone TR.",
        location: "Google Meet",
        startAt: at(10, 30),
        endAt: at(11, 0),
        attendees: "wholesale@partner.example, Eshmum",
        source: "caldav",
        reminderAt: at(10, 15),
        prepNote:
          "Ask: extra 50k GB for Eid-adjacent travel. Walk in with $13.80 retail target and 38% wholesale margin. Do not commit to unlimited.",
      },
      {
        title: "DXB kiosk commercial review",
        description: "Airport Retail Co decision.",
        location: "WhatsApp huddle",
        startAt: at(13, 0),
        endAt: at(13, 30),
        attendees: "ops@dxb-retail.example",
        source: "manual",
        reminderAt: at(12, 45),
        prepNote:
          "One-pager vs Airalo. Offer co-branded QR cards. Fallback: delayed launch in T1 if T3 rate is >18% commission.",
      },
      {
        title: "Content voice session",
        description: "Record 4 social hooks in EN + BN.",
        location: "Command centre",
        startAt: at(16, 0),
        endAt: at(16, 40),
        attendees: "Eshmum",
        source: "manual",
        reminderAt: at(15, 50),
        prepNote: "Hooks: Istanbul landing, Gatwick mum, DXB layover, USA road trip. Keep each under 20s.",
      },
    ],
  });

  const emails = await prisma.emailItem.findMany({ where: { priority: "urgent" } });

  await prisma.approval.createMany({
    data: [
      {
        userId: user.id,
        type: "social",
        title: `instagram post: ${posts[0].caption.slice(0, 60)}`,
        summary: posts[0].caption,
        payload: JSON.stringify({ socialPostId: posts[0].id, platform: "instagram" }),
        status: "pending",
        risk: "high",
        channel: "instagram",
      },
      {
        userId: user.id,
        type: "email",
        title: "Reply: 200 corporate eSIMs for October US trip",
        summary: emails[0]?.draftReply || "Volume quote $18.40 NET7",
        payload: JSON.stringify({ emailId: emails[0]?.id }),
        status: "pending",
        risk: "high",
        channel: "email",
      },
      {
        userId: user.id,
        type: "pricing",
        title: "Set USA 10GB retail to $18.40",
        summary: "8% under Nomad $20. Requires your one-click before storefront update.",
        payload: JSON.stringify({ recommendationId: recUsa?.id }),
        status: "pending",
        risk: "high",
        channel: "dashboard",
      },
      {
        userId: user.id,
        type: "pricing",
        title: "Set Turkey 10GB retail to $13.80",
        summary: recTr?.rationale || "Undercut Saily.",
        payload: JSON.stringify({ recommendationId: recTr?.id }),
        status: "pending",
        risk: "medium",
        channel: "dashboard",
      },
    ],
  });

  await prisma.report.create({
    data: {
      type: "morning_brief",
      title: "Morning Brief",
      language: "en",
      content: `Priorities
1. Approve the $18.40 USA 10GB price before the Horizon Travel quote goes out (200 lines).
2. DXB T3 one-pager must leave by 13:00 — draft is in Approvals / Inbox.
3. Turkey wholesale call at 10:30: hold $13.80 retail, do not promise unlimited.

Meetings
- 10:30 Supplier capacity (prep note on calendar).
- 13:00 DXB kiosk commercial.
- 16:00 Voice-record 4 social hooks (EN + বাংলা).

Inbox
- Two urgent threads. Replies are drafted, not sent.

Market
- Nomad still cheapest on USA 10GB ($20) and Europe 10GB ($23). Recommended undercuts are queued.
- Saily leads Turkey 10GB at $15.

Social
- 1 TikTok already live (18.4k impressions). 3 drafts wait for one-click approve.`,
    },
  });

  await prisma.businessDoc.create({
    data: {
      kind: "plan",
      title: "90-day eSIM go-to-market",
      language: "en",
      content:
        "Corridors: UK↔BD diaspora, TR tourism, GCC layovers, USA inbound. Channel: WhatsApp + IG + Facebook. Pricing: 5–10% under cheapest public rival with human Bangla support as the moat. Ops: n8n posts only after approval unless Away mode is on.",
    },
  });

  await prisma.memory.createMany({
    data: [
      { key: "owner_language", content: "English and Bengali", category: "profile" },
      { key: "competitors", content: "Airalo, Saily, Nomad", category: "market" },
      { key: "approval_policy", content: "High-stakes always HITL. Away mode auto-executes medium/low only.", category: "policy" },
      { key: "social_cadence", content: "3–4 posts per day, SEO/GEO, EN+BN captions", category: "marketing" },
    ],
  });

  const convo = await prisma.conversation.create({
    data: { userId: user.id, title: "Kickoff", channel: "dashboard" },
  });
  await prisma.message.createMany({
    data: [
      {
        conversationId: convo.id,
        role: "assistant",
        content:
          "Command centre is live. Manual approval is ON. I can draft social, scan Airalo/Saily/Nomad, prep meetings and queue email — nothing outbound until you click Approve.",
        model: "harness-mock",
        language: "en",
      },
    ],
  });

  await prisma.website.createMany({
    data: [
      { name: "247eSIM.com", url: "https://247esim.com", status: "online", statusCode: 200, responseMs: 214, lastCheckedAt: minutesAgo(8) },
      { name: "247travellers.com", url: "https://247travellers.com", status: "online", statusCode: 200, responseMs: 268, lastCheckedAt: minutesAgo(8) },
      { name: "247flightsearch.com", url: "https://247flightsearch.com", status: "online", statusCode: 200, responseMs: 301, lastCheckedAt: minutesAgo(8) },
    ],
  });

  // Index 0 is 13 days ago, index 13 is today, so the dashboard can compare
  // the last 7 days against the 7 before it.
  const visits = [1400, 1420, 1450, 1440, 1460, 1470, 1480, 1620, 1710, 1780, 1840, 1860, 1880, 1858];
  const reach = [5200, 5250, 5280, 5300, 5260, 5280, 5348, 6200, 6500, 6800, 7100, 7300, 7400, 7432];
  const mailsHandled = [148, 150, 152, 151, 153, 150, 152, 165, 172, 178, 180, 184, 182, 185];
  const revenue = [1180, 1220, 1140, 1330, 1290, 1400, 1340, 1320, 1480, 1560, 1620, 1780, 1710, 1730];

  await prisma.metricDaily.createMany({
    data: visits.flatMap((_, i) => {
      const date = dayStart(13 - i);
      return [
        { key: "website_visits", date, value: visits[i], source: "analytics" },
        { key: "social_reach", date, value: reach[i], source: "social" },
        { key: "emails_processed", date, value: mailsHandled[i], source: "mailbox" },
      ];
    }),
  });

  const catalogue = [
    { planName: "USA 10GB / 30 days", country: "United States", dataGb: 10, days: 30, amountUsd: 18.4 },
    { planName: "Turkey 10GB / 30 days", country: "Turkey", dataGb: 10, days: 30, amountUsd: 13.8 },
    { planName: "Europe 10GB / 30 days", country: "Europe", dataGb: 10, days: 30, amountUsd: 21.16 },
    { planName: "UK 3GB / 30 days", country: "United Kingdom", dataGb: 3, days: 30, amountUsd: 8.27 },
    { planName: "UAE 5GB / 30 days", country: "United Arab Emirates", dataGb: 5, days: 30, amountUsd: 16.5 },
  ];
  const channels = ["web", "whatsapp", "instagram", "kiosk"];

  let orderSeq = 0;
  const orders: Array<{
    externalId: string;
    planName: string;
    country: string;
    dataGb: number;
    days: number;
    amountUsd: number;
    channel: string;
    customer: string;
    placedAt: Date;
  }> = [];

  revenue.forEach((target, i) => {
    const day = dayStart(13 - i);
    let remaining = target;
    while (remaining > 0) {
      const plan = catalogue[orderSeq % catalogue.length];
      const amountUsd = remaining >= plan.amountUsd ? plan.amountUsd : Math.round(remaining * 100) / 100;
      const placedAt = new Date(day);
      placedAt.setUTCHours(6 + (orderSeq % 15), (orderSeq * 7) % 60, 0, 0);
      orders.push({
        externalId: `SEED-${String(1000 + orderSeq)}`,
        planName: plan.planName,
        country: plan.country,
        dataGb: plan.dataGb,
        days: plan.days,
        amountUsd,
        channel: channels[orderSeq % channels.length],
        customer: `traveller${1000 + orderSeq}@example.com`,
        placedAt,
      });
      remaining = Math.round((remaining - amountUsd) * 100) / 100;
      orderSeq += 1;
    }
  });

  await prisma.order.createMany({ data: orders });

  await prisma.jobRun.createMany({
    data: [
      { name: "competitor_scan", status: "success", message: "21 prices from Airalo, Saily, Nomad", startedAt: minutesAgo(3), finishedAt: minutesAgo(2) },
      { name: "social_drafts", status: "success", message: "3 drafts queued for approval", startedAt: minutesAgo(6), finishedAt: minutesAgo(5) },
      { name: "website_check", status: "success", message: "3 of 3 sites online", startedAt: minutesAgo(9), finishedAt: minutesAgo(8) },
      { name: "morning_brief", status: "success", message: "Brief generated in EN", startedAt: minutesAgo(180), finishedAt: minutesAgo(179) },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { userId: user.id, action: "price_analysis_completed", entity: "PriceRecommendation", detail: "3 countries analysed, 2 undercuts queued", createdAt: minutesAgo(2) },
      { userId: user.id, action: "social_posts_generated", entity: "SocialPost", detail: "3 drafts created for Instagram, Facebook, TikTok", createdAt: minutesAgo(5) },
      { userId: user.id, action: "website_status_check", entity: "Website", detail: "247eSIM.com, 247travellers.com, 247flightsearch.com all online", createdAt: minutesAgo(8) },
      { userId: user.id, action: "order_ingested", entity: "Order", detail: "Turkey 10GB / 30 days via WhatsApp", createdAt: minutesAgo(26) },
      { userId: user.id, action: "seed", entity: "System", detail: "Initial Digital CEO workspace seeded", createdAt: minutesAgo(45) },
    ],
  });

  console.log(`Seeded Digital CEO as ${user.email} with ${orders.length} orders`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
