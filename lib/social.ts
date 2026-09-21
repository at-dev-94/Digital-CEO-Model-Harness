import { prisma } from "./db";
import { runHarness } from "./harness";
import { enqueueApproval } from "./approvals";

const PLATFORMS = ["instagram", "facebook", "tiktok", "instagram"] as const;

export async function generateDailyPosts(userId: string, topic?: string) {
  const focus = topic || "travel eSIM for Turkey, UK, USA and GCC — landing-page SEO + GEO for diaspora and tourists";
  const { text, model } = await runHarness({
    kind: "social",
    messages: [
      {
        role: "user",
        content: `Create exactly 4 social posts as JSON array. Each object: platform (instagram|facebook|tiktok), caption, captionBn, hashtags (comma), mediaPrompt, seoKeywords (comma), geoTargets (comma). Topic: ${focus}. No markdown, JSON only.`,
      },
    ],
  });

  let parsed: Array<{
    platform?: string;
    caption?: string;
    captionBn?: string;
    hashtags?: string;
    mediaPrompt?: string;
    seoKeywords?: string;
    geoTargets?: string;
  }> = [];
  try {
    const jsonText = text.replace(/```json|```/g, "").trim();
    const start = jsonText.indexOf("[");
    const end = jsonText.lastIndexOf("]");
    parsed = JSON.parse(start >= 0 ? jsonText.slice(start, end + 1) : jsonText);
  } catch {
    parsed = [];
  }

  const created = [];
  for (let i = 0; i < 4; i++) {
    const row = parsed[i] || {};
    const platform = (row.platform || PLATFORMS[i]).toLowerCase();
    const caption =
      row.caption ||
      `Land with data in seconds. ${focus.split("—")[0].trim()} from $4. Install before you fly.`;
    const post = await prisma.socialPost.create({
      data: {
        platform,
        caption,
        captionBn:
          row.captionBn ||
          "বিমানে ওঠার আগেই ই-সিম ইনস্টল করুন। ল্যান্ডিংয়ের সাথে সাথেই ইন্টারনেট।",
        hashtags: row.hashtags || "#esim #traveltech #roamingfree #DigitalCEO",
        mediaPrompt: row.mediaPrompt || "Cinematic airport arrival, phone showing instant 5G, gold-teal grade",
        seoKeywords: row.seoKeywords || "travel esim, cheap roaming, turkey esim, uk esim",
        geoTargets: row.geoTargets || "GB, BD, TR, AE, US",
        status: "pending",
        scheduledAt: new Date(Date.now() + (i + 1) * 3 * 60 * 60 * 1000),
      },
    });
    await enqueueApproval({
      userId,
      type: "social",
      title: `${platform} post: ${caption.slice(0, 72)}`,
      summary: caption,
      payload: { socialPostId: post.id, platform },
      risk: "high",
      channel: platform,
    });
    created.push(post);
  }
  return { posts: created, model };
}
