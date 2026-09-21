import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateDailyPosts } from "@/lib/social";

export async function GET() {
  try {
    await requireSession();
    const posts = await prisma.socialPost.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = (await req.json().catch(() => ({}))) as { topic?: string };
    const result = await generateDailyPosts(user.id, body.topic);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
