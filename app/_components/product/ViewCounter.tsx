"use client";

import { useEffect, useRef } from "react";

// Fires a single fire-and-forget view-count increment when the PDP mounts.
// Errors are intentionally swallowed — this is non-critical demand telemetry.
export function ViewCounter({ pn }: { pn: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/parts/${encodeURIComponent(pn)}/view`, { method: "POST" }).catch(() => {});
  }, [pn]);

  return null;
}
