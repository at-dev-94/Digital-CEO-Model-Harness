import { NextRequest, NextResponse } from "next/server";
import { errorResponse, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runHarness, detectLanguage, detectTask } from "@/lib/harness";
import { rateLimit } from "@/lib/rate-limit";
import { generateDailyPosts } from "@/lib/social";
import { enqueueApproval } from "@/lib/approvals";

export async function GET() {
  try {
    const user = await requireSession();
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      take: 8,
    });
    return NextResponse.json({ conversations });
  } catch (err) {
    const { body, status } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const limited = rateLimit(`chat:${user.id}`, 40, 60_000);
    if (!limited.ok) return NextResponse.json({ error: "Slow down" }, { status: 429 });

    const body = (await req.json()) as {
      message?: string;
      conversationId?: string;
      language?: "en" | "bn";
    };
    const text = body.message?.trim();
    if (!text) return NextResponse.json({ error: "Message required" }, { status: 400 });

    let conversationId = body.conversationId;
    if (!conversationId) {
      const convo = await prisma.conversation.create({
        data: { userId: user.id, title: text.slice(0, 48), channel: "dashboard" },
      });
      conversationId = convo.id;
    }

    await prisma.message.create({
      data: {
        conversationId,
        role: "user",
        content: text,
        language: body.language || detectLanguage(text),
      },
    });

    const history = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const kind = detectTask(text);
    const result = await runHarness({
      kind,
      language: body.language || detectLanguage(text),
      messages: history.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    });

    if (kind === "social") {
      await generateDailyPosts(user.id, text);
    }
    if (kind === "email") {
      const urgent = await prisma.emailItem.findFirst({
        where: { priority: "urgent", status: { not: "replied" } },
        orderBy: { receivedAt: "desc" },
      });
      if (urgent) {
        await enqueueApproval({
          userId: user.id,
          type: "email",
          title: `Reply: ${urgent.subject}`,
          summary: urgent.draftReply || result.text.slice(0, 400),
          payload: { emailId: urgent.id },
          risk: "high",
          channel: "email",
        });
      }
    }

    const assistant = await prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: result.text,
        model: result.model,
        language: result.language,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      conversationId,
      message: assistant,
      model: result.model,
      kind: result.kind,
    });
  } catch (err) {
    const { body, status } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
