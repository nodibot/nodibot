import { google } from "googleapis";
import { buildMimeMessage } from "./outreach/mime";

// Gmail API client built from an OAuth2 refresh token for the single sending
// mailbox. Env: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER.

export interface SendResult {
  messageId: string;
  threadId: string;
}

export interface ThreadMessage {
  fromHeader: string;
  internalDate: number; // epoch ms
}

// Interface so the orchestrator can be exercised with a fake in tests.
export interface EmailSender {
  send(args: { to: string; subject: string; body: string; threadId?: string; inReplyTo?: string }): Promise<SendResult>;
  getThreadMessages(threadId: string): Promise<ThreadMessage[]>;
  readonly senderEmail: string;
}

function gmailClient() {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    throw new Error("Missing GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN.");
  }
  const oauth2 = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: "v1", auth: oauth2 });
}

export function createGmailSender(): EmailSender {
  const senderEmail = process.env.GMAIL_SENDER ?? "";
  if (!senderEmail) throw new Error("Missing GMAIL_SENDER.");
  const gmail = gmailClient();

  return {
    senderEmail,
    async send({ to, subject, body, threadId, inReplyTo }) {
      const raw = buildMimeMessage({ from: senderEmail, to, subject, body, inReplyTo });
      const res = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw, ...(threadId ? { threadId } : {}) },
      });
      return { messageId: res.data.id ?? "", threadId: res.data.threadId ?? "" };
    },
    async getThreadMessages(threadId) {
      const res = await gmail.users.threads.get({ userId: "me", id: threadId, format: "metadata", metadataHeaders: ["From"] });
      return (res.data.messages ?? []).map((m) => ({
        fromHeader: m.payload?.headers?.find((h) => h.name === "From")?.value ?? "",
        internalDate: Number(m.internalDate ?? 0),
      }));
    },
  };
}

// Pure helper: does the thread contain an inbound message after our last send?
export function threadHasReply(messages: ThreadMessage[], senderEmail: string, lastSentMs: number): boolean {
  return messages.some((m) => m.internalDate > lastSentMs && !m.fromHeader.toLowerCase().includes(senderEmail.toLowerCase()));
}
