import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "digital-ceo",
    time: new Date().toISOString(),
  });
}
