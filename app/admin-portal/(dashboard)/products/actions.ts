"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPart, deletePart, updatePart } from "@/app/_lib/admin";
import { HOSTS } from "@/app/_lib/taxonomy";
import type { AdminPartInput, StockState } from "@/app/_lib/types";

function parsePartForm(formData: FormData): AdminPartInput {
  const num = (key: string): number => {
    const v = Number(formData.get(key));
    return Number.isFinite(v) ? v : 0;
  };
  const str = (key: string): string => String(formData.get(key) ?? "").trim();
  const optNum = (key: string): number | null => {
    const raw = formData.get(key);
    if (raw === null || String(raw).trim() === "") return null;
    const v = Number(raw);
    return Number.isFinite(v) ? v : null;
  };
  const optStr = (key: string): string | null => {
    const v = str(key);
    return v === "" ? null : v;
  };

  const stock = (str("stock") === "in" ? "in" : "request") as StockState;
  const hosts = HOSTS.map((h) => h.id).filter((id) => formData.get(`host_${id}`) === "on");

  return {
    cat: str("cat"),
    brand: str("brand"),
    pn: str("pn"),
    name: str("name"),
    refurb_low: num("refurb_low"),
    refurb_high: num("refurb_high"),
    oem: num("oem"),
    life: str("life"),
    cond: str("cond"),
    stock,
    qty: stock === "in" ? optNum("qty") : null,
    lead: str("lead"),
    hosts,
    is_active: formData.get("is_active") === "on",
    supplier_notes: optStr("supplier_notes"),
    resale_ref: optNum("resale_ref"),
  };
}

export async function createPartAction(formData: FormData) {
  await createPart(parsePartForm(formData));
  revalidatePath("/admin-portal/products");
  redirect("/admin-portal/products");
}

export async function updatePartAction(id: string, formData: FormData) {
  await updatePart(id, parsePartForm(formData));
  revalidatePath("/admin-portal/products");
  redirect("/admin-portal/products");
}

export async function deletePartAction(formData: FormData) {
  const id = String(formData.get("id"));
  await deletePart(id);
  revalidatePath("/admin-portal/products");
}
