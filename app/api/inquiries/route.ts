import { NextResponse } from "next/server";
import { createInquiry, validateInquiry } from "@/app/_lib/inquiries";
import type { InquiryInput } from "@/app/_lib/types";

export async function POST(request: Request) {
  let body: Partial<InquiryInput>;
  try {
    body = (await request.json()) as Partial<InquiryInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { ok, errors } = validateInquiry(body);
  if (!ok) {
    return NextResponse.json({ error: "Validation failed", fields: errors }, { status: 400 });
  }

  try {
    const { ticket } = await createInquiry({
      partId: body.partId ?? null,
      partPn: body.partPn ?? null,
      name: body.name!,
      company: body.company ?? null,
      contact: body.contact!,
      channel: body.channel ?? "Email",
      urgency: body.urgency ?? "spare",
      qty: body.qty ?? null,
      cond: body.cond ?? null,
      notes: body.notes ?? null,
    });
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    console.error("createInquiry failed:", err);
    return NextResponse.json({ error: "Could not save inquiry" }, { status: 500 });
  }
}
