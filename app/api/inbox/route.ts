import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enqueueApproval } from "@/lib/approvals";
import { runHarness } from "@/lib/harness";

export async function GET() {
  try {
    await requireSession();
    const items = await prisma.emailItem.findMany({ orderBy: { receivedAt: "desc" } });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = (await req.json()) as { id?: string; action?: "draft" | "queue" };
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const email = await prisma.emailItem.findUnique({ where: { id: body.id } });
    if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let draft = email.draftReply;
    if (!draft || body.action === "draft") {
      const { text } = await runHarness({
        kind: "email",
        messages: [
          {
            role: "user",
            content: `Draft a concise reply from the owner of an eSIM company. Email from ${email.fromName} <${email.fromEmail}>\nSubject: ${email.subject}\n\n${email.body}`,
          },
        ],
      });
      draft = text;
      await prisma.emailItem.update({
        where: { id: email.id },
        data: { draftReply: draft, status: "drafted" },
      });
    }

    if (body.action === "queue") {
      await enqueueApproval({
        userId: user.id,
        type: "email",
        title: `Reply: ${email.subject}`,
        summary: draft || "",
        payload: { emailId: email.id },
        risk: "high",
        channel: "email",
      });
    }

    return NextResponse.json({ email: await prisma.emailItem.findUnique({ where: { id: email.id } }) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
