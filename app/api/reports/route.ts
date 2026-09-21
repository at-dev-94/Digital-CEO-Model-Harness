import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runHarness } from "@/lib/harness";

export async function GET() {
  try {
    await requireSession();
    const reports = await prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = (await req.json()) as { type?: string; language?: "en" | "bn" };
    const type = body.type || "daily";
    const { text } = await runHarness({
      kind: "brief",
      language: body.language || (user.language as "en" | "bn"),
      messages: [
        {
          role: "user",
          content: `Write a ${type} executive report for an eSIM business. Cover market, social, inbox, and next actions. Use markdown headings.`,
        },
      ],
    });
    const report = await prisma.report.create({
      data: {
        type,
        title: `${type.replace("_", " ")} report`,
        content: text,
        language: body.language || user.language,
      },
    });
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
