import { NextResponse } from "next/server";
import { incrementView } from "@/app/_lib/parts";

export async function POST(_request: Request, { params }: { params: Promise<{ pn: string }> }) {
  const { pn } = await params;
  try {
    await incrementView(decodeURIComponent(pn));
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Non-critical telemetry — log and report failure without surfacing details.
    console.error("incrementView failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
