"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Ic } from "@/app/_components/icons";
import { buildContactEmailHref } from "@/app/_lib/contact-email";
import { trackEvent } from "@/app/_lib/analytics-client";
import { withLocale } from "@/app/_lib/locale-path";
import { buildWhatsAppHref } from "@/app/_lib/whatsapp";
import type { Channel } from "@/app/_lib/types";

interface FormState {
  channel: Channel;
  contact: string;
  name: string;
  company: string;
  qty: string;
  notes: string;
}

const INITIAL: FormState = {
  channel: "WhatsApp",
  contact: "",
  name: "",
  company: "",
  qty: "1",
  notes: "",
};

const CHANNELS: { id: Channel; icon: React.ReactNode }[] = [
  { id: "WhatsApp", icon: <Ic.whatsapp /> },
  { id: "Email", icon: <Ic.mail /> },
  { id: "Phone", icon: <Ic.phone /> },
];

export function NoMatchRfqForm({ partPn }: { partPn: string }) {
  const locale = useLocale();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);
  const whatsappHref = buildWhatsAppHref({
    partPn,
    message: `Hi nodibot - I searched for ${partPn}, but did not find it in the catalog. Can you source it?`,
  });
  const emailHref = buildContactEmailHref({
    partPn,
    subject: `Unlisted part RFQ: ${partPn}`,
    body: `Hi nodibot team,\n\nI searched for ${partPn}, but did not find it in the catalog. Can you source and quote it?\n\nThank you.`,
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const submit = async () => {
    if (!form.contact.trim() || submitting) {
      setErrors((prev) => ({ ...prev, contact: true }));
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: null,
          partPn,
          name: form.name.trim() || "Website no-match RFQ",
          company: form.company,
          contact: form.contact,
          channel: form.channel,
          urgency: "spare",
          qty: form.qty ? Number(form.qty) : null,
          cond: null,
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { ticket: string };
      trackEvent({
        event_name: "rfq_submitted",
        part_pn: partPn,
        query: partPn,
        channel: form.channel,
        metadata: {
          source: "no_match_catalog_search",
          qty: form.qty ? Number(form.qty) : null,
        },
      });
      setTicket(data.ticket);
    } catch {
      setServerError("Something went wrong sending your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (ticket) {
    return (
      <div className="rfq-panel fade-in">
        <div className="rfq-success">
          <div className="check">
            <Ic.check />
          </div>
          <h3>Unlisted part request received</h3>
          <p>
            We will check our sourcing network for <strong className="mono">{partPn}</strong> and reply via{" "}
            {form.channel}.
          </p>
          <div className="rfq-ticket">Reference {ticket}</div>
          <div className="resp-pill" style={{ justifyContent: "center" }}>
            <span className="pulse" /> Sourcing desk online
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rfq-panel fade-in">
      <div className="rfq-top">
        <div className="rfq-title">
          <Ic.search /> Source this unlisted part
        </div>
        <div className="rfq-sub">
          No indexed match for <strong className="mono">{partPn}</strong>. Leave one contact and we will check verified
          suppliers.
        </div>
      </div>

      <div className="rfq-body">
        <div className="rfq-fast-exit">
          {whatsappHref && (
            <a
              className="btn btn-primary btn-lg"
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent({
                  event_name: "whatsapp_click",
                  query: partPn,
                  metadata: { surface: "no_match_rfq" },
                })
              }
            >
              <Ic.whatsapp /> WhatsApp source
            </a>
          )}
          {emailHref && (
            <a
              className="btn btn-ghost btn-lg"
              href={emailHref}
              onClick={() =>
                trackEvent({
                  event_name: "email_click",
                  query: partPn,
                  metadata: { surface: "no_match_rfq" },
                })
              }
            >
              <Ic.mail /> Email source
            </a>
          )}
        </div>

        <div className="rfq-or">or leave one contact and we will reply</div>

        <div className="field">
          <label>
            Contact channel <span className="req">*</span>
          </label>
          <div className="chan">
            {CHANNELS.map((channel) => (
              <div
                key={channel.id}
                className={"chan-opt" + (form.channel === channel.id ? " on" : "")}
                onClick={() => set("channel", channel.id)}
              >
                {channel.icon}
                {channel.id}
              </div>
            ))}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Name / company</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Optional" />
          </div>
          <div className="field">
            <label>
              {form.channel === "Email" ? "Work email" : form.channel === "Phone" ? "Phone number" : "WhatsApp number"}{" "}
              <span className="req">*</span>
            </label>
            <input
              className={errors.contact ? "err" : ""}
              value={form.contact}
              onChange={(e) => set("contact", e.target.value)}
              placeholder={form.channel === "Email" ? "you@factory.com" : "+86 138 0000 0000"}
            />
            {errors.contact && <span className="errmsg">Required so we can send your quote</span>}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Quantity</label>
            <input value={form.qty} onChange={(e) => set("qty", e.target.value)} type="number" min="1" />
          </div>
          <div className="field">
            <label>Company</label>
            <input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Plant / integrator" />
          </div>
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Serial / firmware revision, host system, target lead time..."
          />
        </div>

        {serverError && <div className="errmsg">{serverError}</div>}
      </div>

      <div className="rfq-foot">
        <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={submitting}>
          <Ic.bolt /> {submitting ? "Sending..." : "Request sourcing quote"}
        </button>
        <div className="rfq-assure">
          <Ic.shield /> No payment now. We quote after sourcing review.
        </div>
        <div className="rfq-assure">
          Have several missing parts?{" "}
          <Link href={withLocale(locale, "/bulk-rfq")}>Send a bulk RFQ</Link>
        </div>
      </div>
    </div>
  );
}
