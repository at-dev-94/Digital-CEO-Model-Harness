import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decideApproval } from "@/lib/approvals";

export async function GET() {
  try {
    await requireSession();
    const items = await prisma.approval.findMany({ orderBy: { createdAt: "desc" }, take: 80 });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = (await req.json()) as { id?: string; decision?: "approved" | "rejected" };
    if (!body.id || !body.decision) {
      return NextResponse.json({ error: "id and decision required" }, { status: 400 });
    }
    const item = await decideApproval(body.id, body.decision, user.id);
    return NextResponse.json({ item });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Failed" }, { status: 400 });
  }
}
