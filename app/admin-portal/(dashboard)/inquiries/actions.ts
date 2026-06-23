"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSourcingQuote,
  selectSourcingQuote,
  updateInquiryStatus,
} from "@/app/_lib/admin";
import type { InquiryStatus, SourcingQuote } from "@/app/_lib/types";

export async function setStatusAction(id: string, status: InquiryStatus) {
  await updateInquiryStatus(id, status);
  revalidatePath("/admin-portal/inquiries");
  revalidatePath(`/admin-portal/inquiries/${id}`);
}

function str(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function positiveInt(value: string): number | null {
  if (!value) return null;
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function addSourcingQuoteAction(formData: FormData) {
  const inquiryId = str(formData, "inquiry_id");
  if (!inquiryId) throw new Error("Missing inquiry id.");

  await createSourcingQuote({
    inquiry_id: inquiryId,
    platform: (str(formData, "platform") || "1688") as SourcingQuote["platform"],
    supplier_name: str(formData, "supplier_name"),
    listing_url: str(formData, "listing_url"),
    contact_handle: str(formData, "contact_handle") || null,
    condition: str(formData, "condition") || null,
    moq: positiveInt(str(formData, "moq")),
    lead_time_days: positiveInt(str(formData, "lead_time_days")),
    notes: str(formData, "notes") || null,
  });

  revalidatePath(`/admin-portal/inquiries/${inquiryId}`);
}

export async function selectSourcingQuoteAction(formData: FormData) {
  const quoteId = str(formData, "quote_id");
  if (!quoteId) throw new Error("Missing sourcing quote id.");

  const inquiryId = await selectSourcingQuote(quoteId);
  revalidatePath("/admin-portal/inquiries");
  revalidatePath(`/admin-portal/inquiries/${inquiryId}`);
  redirect(`/admin-portal/inquiries/${inquiryId}`);
}
