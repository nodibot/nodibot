"use client";

import { buildWhatsAppHref } from "@/app/_lib/whatsapp";
import { Ic } from "./icons";

export function WaFloat({ partPn }: { partPn?: string }) {
  const href = buildWhatsAppHref({ partPn });

  if (!href) {
    return (
      <button
        className="wa-float"
        title="WhatsApp chat (configure NEXT_PUBLIC_WHATSAPP_URL)"
        onClick={(e) => e.preventDefault()}
      >
        <Ic.whatsapp /> Chat to source
      </button>
    );
  }

  return (
    <a className="wa-float" href={href} target="_blank" rel="noopener noreferrer">
      <Ic.whatsapp /> Chat to source
    </a>
  );
}
