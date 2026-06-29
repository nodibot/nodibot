"use client";

import { useMemo, useState } from "react";
import { Ic } from "@/app/_components/icons";
import { trackEvent } from "@/app/_lib/analytics-client";
import type { Channel, Urgency } from "@/app/_lib/types";

interface FormState {
  partNumbers: string;
  channel: Channel;
  contact: string;
  name: string;
  company: string;
  urgency: Urgency;
  notes: string;
}

const INITIAL: FormState = {
  partNumbers: "",
  channel: "WhatsApp",
  contact: "",
  name: "",
  company: "",
  urgency: "spare",
  notes: "",
};

const CHANNELS: { id: Channel; icon: React.ReactNode }[] = [
  { id: "WhatsApp", icon: <Ic.whatsapp /> },
  { id: "Email", icon: <Ic.mail /> },
  { id: "Phone", icon: <Ic.phone /> },
];

function parsePartNumbers(value: string): string[] {
  return value
    .split(/[\n,;\t]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 50);
}

export function BulkRfqForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);
  const partNumbers = useMemo(() => parsePartNumbers(form.partNumbers), [form.partNumbers]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const submit = async () => {
    const nextErrors: Record<string, boolean> = {};
    if (partNumbers.length === 0) nextErrors.partNumbers = true;
    if (!form.contact.trim()) nextErrors.contact = true;
    if (Object.keys(nextErrors).length > 0 || submitting) {
      setErrors(nextErrors);
      return;
    }

    const notes = [
      "Bulk RFQ part numbers:",
      ...partNumbers.map((pn) => `- ${pn}`),
      form.notes.trim() ? `\nBuyer notes:\n${form.notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: null,
          partPn: partNumbers.length === 1 ? partNumbers[0] : null,
          name: form.name.trim() || "Website bulk RFQ",
          company: form.company,
          contact: form.contact,
          channel: form.channel,
          urgency: form.urgency,
          qty: partNumbers.length,
          cond: null,
          notes,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { ticket: string };
      trackEvent({
        event_name: "bulk_rfq_submitted",
        part_pn: partNumbers.length === 1 ? partNumbers[0] : undefined,
        query: partNumbers.join(", "),
        channel: form.channel,
        metadata: {
          part_count: partNumbers.length,
          urgency: form.urgency,
          part_numbers: partNumbers,
        },
      });
      setTicket(data.ticket);
    } catch {
      setServerError("Something went wrong sending your bulk request. Please try again.");
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
          <h3>Bulk RFQ received</h3>
          <p>
            We will review {partNumbers.length} part number{partNumbers.length === 1 ? "" : "s"} and reply via{" "}
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
      <div className={"rfq-top" + (form.urgency === "down" ? " urgent-mode" : "")}>
        <div className="rfq-title">
          <Ic.doc /> Bulk RFQ
        </div>
        <div className="rfq-sub">
          Paste up to 50 part numbers. We will review availability, sourcing options, and lead times in one request.
        </div>
      </div>

      <div className="rfq-body">
        <div className="field">
          <label>
            Part numbers <span className="req">*</span>
          </label>
          <textarea
            className={errors.partNumbers ? "err" : ""}
            value={form.partNumbers}
            onChange={(e) => set("partNumbers", e.target.value)}
            placeholder={"3HAC050363-001\nA06B-6114-H206\n6ES7315-2AH14-0AB0"}
            rows={7}
          />
          <span className="hint">
            {partNumbers.length === 0
              ? "One per line is best. Commas and semicolons also work."
              : `${partNumbers.length} part number${partNumbers.length === 1 ? "" : "s"} detected.`}
          </span>
          {errors.partNumbers && <span className="errmsg">Add at least one part number</span>}
        </div>

        <div className="field">
          <label>Machine status</label>
          <div className="seg">
            <div
              className={"seg-opt urgent" + (form.urgency === "down" ? " on urgent" : "")}
              onClick={() => set("urgency", "down")}
            >
              <span className="st">
                <span className="ic" />
                Line down
              </span>
              <span className="sd">Prioritize this list</span>
            </div>
            <div
              className={"seg-opt" + (form.urgency === "spare" ? " on" : "")}
              onClick={() => set("urgency", "spare")}
            >
              <span className="st">
                <span className="ic" />
                Stocking spares
              </span>
              <span className="sd">Planning purchase</span>
            </div>
          </div>
        </div>

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

        <div className="field">
          <label>Company</label>
          <input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Plant / integrator" />
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Target delivery date, condition preference, shipping country, machine model..."
          />
        </div>

        {serverError && <div className="errmsg">{serverError}</div>}
      </div>

      <div className="rfq-foot">
        <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={submitting}>
          <Ic.bolt /> {submitting ? "Sending..." : "Send bulk RFQ"}
        </button>
        <div className="rfq-assure">
          <Ic.shield /> One request. Multiple part numbers. No payment now.
        </div>
      </div>
    </div>
  );
}
