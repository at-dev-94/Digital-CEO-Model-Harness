import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runHarness } from "@/lib/harness";

export async function GET() {
  try {
    await requireSession();
    const events = await prisma.calendarEvent.findMany({ orderBy: { startAt: "asc" } });
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const body = (await req.json()) as { id?: string };
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const event = await prisma.calendarEvent.findUnique({ where: { id: body.id } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { text } = await runHarness({
      kind: "brief",
      messages: [
        {
          role: "user",
          content: `Write a 120-word meeting prep note. Title: ${event.title}. Description: ${event.description || ""}. Attendees: ${event.attendees || ""}.`,
        },
      ],
    });
    const updated = await prisma.calendarEvent.update({
      where: { id: event.id },
      data: { prepNote: text },
    });
    return NextResponse.json({ event: updated });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
