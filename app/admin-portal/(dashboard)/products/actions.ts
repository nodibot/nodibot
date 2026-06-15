"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPart, deletePart, updatePart } from "@/app/_lib/admin";
import { HOSTS } from "@/app/_lib/taxonomy";
import type { AdminPartInput, StockState } from "@/app/_lib/types";

type ImageStatus = AdminPartInput["image_status"];

function parsePartForm(formData: FormData): AdminPartInput {
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
  const lines = (key: string): string[] =>
    str(key)
      .split(/\r?\n|;/)
      .map((v) => v.trim())
      .filter(Boolean);
  const imageStatus = ((): ImageStatus => {
    const value = str("image_status");
    return value === "pending_review" || value === "approved" || value === "rejected"
      ? value
      : "missing";
  })();

  const stock = (str("stock") === "in" ? "in" : "request") as StockState;
  const hosts = HOSTS.map((h) => h.id).filter((id) => formData.get(`host_${id}`) === "on");

  return {
    cat: str("cat"),
    brand: str("brand"),
    pn: str("pn"),
    name: str("name"),
    life: str("life"),
    cond: str("cond"),
    stock,
    qty: stock === "in" ? optNum("qty") : null,
    lead: str("lead"),
    hosts,
    is_active: formData.get("is_active") === "on",
    alternative_pns: lines("alternative_pns"),
    category_l1: optStr("category_l1"),
    category_l2: optStr("category_l2"),
    series: optStr("series"),
    equipment_type: optStr("equipment_type"),
    compatible_controllers: lines("compatible_controllers"),
    compatible_robot_models: lines("compatible_robot_models"),
    controller_generation: optStr("controller_generation"),
    availability_label: optStr("availability_label"),
    description_kr: optStr("description_kr"),
    failure_keywords: lines("failure_keywords"),
    image_url: optStr("image_url"),
    image_storage_path: optStr("image_storage_path"),
    image_status: imageStatus,
    demand_score: optNum("demand_score"),
    scarcity_score: optNum("scarcity_score"),
    sales_priority_grade: optStr("sales_priority_grade"),
    sales_priority_score: optNum("sales_priority_score"),
    source_urls: lines("source_urls"),
    admin_notes: optStr("admin_notes"),
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
