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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function encodeQuotedPrintable(input: string): string {
  const normalized = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines: string[] = [];
  for (const line of normalized.split("\n")) {
    const bytes = Buffer.from(line, "utf8");
    let encoded = "";
    for (const byte of bytes) {
      if ((byte >= 33 && byte <= 126 && byte !== 0x3d) || byte === 0x09 || byte === 0x20) {
        encoded += String.fromCharCode(byte);
      } else {
        encoded += "=" + byte.toString(16).toUpperCase().padStart(2, "0");
      }
    }
    if (encoded.endsWith(" ")) encoded = encoded.slice(0, -1) + "=20";
    if (encoded.endsWith("\t")) encoded = encoded.slice(0, -1) + "=09";

    while (encoded.length > 76) {
      let cut = 75;
      while (cut > 0 && encoded[cut - 1] === "=") cut--;
      const eq = encoded.lastIndexOf("=", cut);
      if (eq >= 0 && cut - eq < 3) cut = eq;
      if (cut < 1) cut = Math.min(75, encoded.length);
      lines.push(encoded.slice(0, cut) + "=");
      encoded = encoded.slice(cut);
    }
    lines.push(encoded);
  }
  return lines.join("\r\n");
}

function htmlBody(plain: string): string {
  const html = escapeHtml(plain).replace(/\n/g, "<br>\n");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#15171b;">${html}</div>`;
}

// Returns a base64url-encoded MIME message ready for users.messages.send `raw`.
export function buildMimeMessage({ from, to, subject, body, inReplyTo }: MimeInput): string {
  const boundary = "nodibot-outreach";
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
    headers.push(`References: ${inReplyTo}`);
  }

  const raw = [
    headers.join("\r\n"),
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=\"UTF-8\"",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    encodeQuotedPrintable(body),
    `--${boundary}`,
    "Content-Type: text/html; charset=\"UTF-8\"",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    encodeQuotedPrintable(htmlBody(body)),
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return encodeBase64Url(raw);
}
