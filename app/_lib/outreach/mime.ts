// Pure RFC822 message construction + base64url encoding for the Gmail API.

export function encodeBase64Url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface MimeInput {
  from: string;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
}

// Returns a base64url-encoded MIME message ready for users.messages.send `raw`.
export function buildMimeMessage({ from, to, subject, body, inReplyTo }: MimeInput): string {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
  ];
  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
    headers.push(`References: ${inReplyTo}`);
  }
  const raw = headers.join("\r\n") + "\r\n\r\n" + body;
  return encodeBase64Url(raw);
}
