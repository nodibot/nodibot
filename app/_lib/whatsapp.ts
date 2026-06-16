// Click-to-chat URLs for WhatsApp Business. Set NEXT_PUBLIC_WHATSAPP_URL to the

export function getWhatsAppBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_WHATSAPP_URL?.trim();
  return url || null;
}

export function buildWhatsAppHref(opts?: { partPn?: string; message?: string }): string | null {
  const base = getWhatsAppBaseUrl();
  if (!base) return null;

  const text =
    opts?.message ??
    (opts?.partPn
      ? `Hi nodibot — I need a quote for part ${opts.partPn}.`
      : "Hi nodibot — I'm looking to source an automation part.");

  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}text=${encodeURIComponent(text)}`;
}
