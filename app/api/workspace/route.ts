import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runHarness } from "@/lib/harness";

export async function GET() {
  try {
    await requireSession();
    const docs = await prisma.businessDoc.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ docs });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = (await req.json()) as { kind?: string; prompt?: string; language?: "en" | "bn" };
    const kind = body.kind || "plan";
    const prompt = body.prompt || "90-day growth plan for a travel eSIM brand competing with Airalo, Saily and Nomad.";
    const { text } = await runHarness({
      kind: kind === "brainstorm" ? "brainstorm" : "plan",
      language: body.language || (user.language as "en" | "bn"),
      messages: [{ role: "user", content: `Write a ${kind}. ${prompt}` }],
    });
    const doc = await prisma.businessDoc.create({
      data: {
        kind,
        title: prompt.slice(0, 80),
        content: text,
        language: body.language || user.language,
      },
    });
    return NextResponse.json({ doc });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
