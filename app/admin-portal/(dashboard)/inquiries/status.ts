import type { InquiryStatus } from "@/app/_lib/types";

// The sourcing pipeline, in order.
export const STATUSES: { id: InquiryStatus; label: string }[] = [
  { id: "new", label: "New inquiry" },
  { id: "sourcing", label: "Sourcing" },
  { id: "found", label: "Supplier found" },
  { id: "quoted", label: "Quoted" },
  { id: "closed", label: "Closed" },
];
