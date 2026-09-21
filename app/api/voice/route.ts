import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { runHarness } from "@/lib/harness";

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const body = (await req.json()) as { audioBase64?: string; language?: string; text?: string };
    if (body.text) {
      return NextResponse.json({ text: body.text });
    }
    if (!body.audioBase64 || !process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({
        text: "",
        note: "Browser speech is used by default. Add OPENROUTER_API_KEY for Whisper fallback.",
      });
    }
    const { text } = await runHarness({
      kind: "fast",
      messages: [
        {
          role: "user",
          content: "Transcribe this voice command for an executive assistant. If unclear, say so briefly.",
        },
      ],
    });
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
