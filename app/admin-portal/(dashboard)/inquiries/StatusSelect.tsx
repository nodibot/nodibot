"use client";

import { useTransition } from "react";
import { setStatusAction } from "./actions";
import { STATUSES } from "./status";
import type { InquiryStatus } from "@/app/_lib/types";

export function StatusSelect({ id, status }: { id: string; status: InquiryStatus }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => setStatusAction(id, e.target.value as InquiryStatus))
      }
    >
      {STATUSES.map((s) => (
        <option key={s.id} value={s.id}>
          Move to: {s.label}
        </option>
      ))}
    </select>
  );
}
