"use client";

import { Ic } from "./icons";

// Builds a WhatsApp click-to-chat URL from NEXT_PUBLIC_WHATSAPP_URL
// (e.g. "https://wa.me/8613800000000"), optionally pre-filling the part context.
function buildHref(partPn?: string): string | null {
  const base = process.env.NEXT_PUBLIC_WHATSAPP_URL;
  if (!base) return null;
  const text = partPn
    ? `Hi nodibot — I need a quote for part ${partPn}.`
    : "Hi nodibot — I'm looking to source an automation part.";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}text=${encodeURIComponent(text)}`;
}

export function WaFloat({ partPn }: { partPn?: string }) {
  const href = buildHref(partPn);

  if (!href) {
    // No WhatsApp number configured yet — keep the affordance but inert.
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
