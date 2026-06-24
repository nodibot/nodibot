const DEFAULT_CONTACT_EMAILS = "robert@hello-nodibot.com";

function splitEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function getContactEmailRecipients(): string[] {
  const configured = process.env.NEXT_PUBLIC_CONTACT_EMAILS?.trim();
  if (!configured) return splitEmails(DEFAULT_CONTACT_EMAILS);
  return splitEmails(configured);
}

export function buildContactEmailHref(opts?: {
  partPn?: string;
  subject?: string;
  body?: string;
}): string | null {
  const recipients = getContactEmailRecipients();
  if (recipients.length === 0) return null;

  const subject =
    opts?.subject ??
    (opts?.partPn ? `RFQ request for ${opts.partPn}` : "RFQ request from nodibot website");
  const body =
    opts?.body ??
    (opts?.partPn
      ? `Hi nodibot team,\n\nI need a quote for part ${opts.partPn}.\n\nThank you.`
      : "Hi nodibot team,\n\nI need help sourcing an automation part.\n\nThank you.");

  const to = recipients.join(",");
  const params = new URLSearchParams({
    subject,
    body,
  });
  return `mailto:${to}?${params.toString()}`;
}
