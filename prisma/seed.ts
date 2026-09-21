import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function at(hours: number, minutes = 0) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
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
      { key: "companyName", value: process.env.COMPANY_NAME || "Eshmum eSIM" },
      { key: "language", value: "en" },
      { key: "postsPerDay", value: "4" },
      { key: "approvalRequired", value: "true" },
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
      source: "catalog",
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

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "seed",
      entity: "System",
      detail: "Initial Digital CEO workspace seeded",
    },
  });

  console.log("Seeded Digital CEO as", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
