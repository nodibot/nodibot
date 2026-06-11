"use server";

import { revalidatePath } from "next/cache";
import { updateInquiryStatus } from "@/app/_lib/admin";
import type { InquiryStatus } from "@/app/_lib/types";

export async function setStatusAction(id: string, status: InquiryStatus) {
  await updateInquiryStatus(id, status);
  revalidatePath("/admin-portal/inquiries");
}
