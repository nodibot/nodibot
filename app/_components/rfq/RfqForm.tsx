"use client";

import { useState } from "react";
import { Ic } from "@/app/_components/icons";
import { trackEvent } from "@/app/_lib/analytics-client";
import type { Channel, Part, Urgency } from "@/app/_lib/types";

interface FormState {
  urgency: Urgency;
  qty: string;
  channel: Channel;
  name: string;
  company: string;
  contact: string;
  cond: string;
  notes: string;
}

const INITIAL: FormState = {
  urgency: "down",
  qty: "1",
  channel: "WhatsApp",
  name: "",
  company: "",
  contact: "",
  cond: "any",
  notes: "",
};

const CHANNELS: { id: Channel; icon: React.ReactNode }[] = [
  { id: "WhatsApp", icon: <Ic.whatsapp /> },
  { id: "Email", icon: <Ic.mail /> },
  { id: "Phone", icon: <Ic.phone /> },
];

function Success({ part, urgency, channel, ticket }: { part: Part; urgency: Urgency; channel: Channel; ticket: string }) {
  return (
    <div className="rfq-success fade-in">
      <div className="check">
        <Ic.check />
      </div>
      <h3>{urgency === "down" ? "Priority quote in progress" : "Request received"}</h3>
      <p>
        Our sourcing desk is cross-referencing verified suppliers for{" "}
        <strong className="mono" style={{ color: "var(--ink)" }}>
          {part.pn}
        </strong>
        .
        {urgency === "down"
          ? " Flagged as line-down — expect a response within the hour."
          : " You'll have a quote within 2 business hours."}
      </p>
      <div className="rfq-ticket">
        Reference {ticket} · we&apos;ll reply via {channel}
      </div>
      <div className="resp-pill" style={{ justifyContent: "center" }}>
        <span className="pulse" /> Sourcing desk online · 06:00–23:00 CST
      </div>
    </div>
  );
}

export function RfqForm({ part }: { part: Part }) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ticket: string } | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: false }));
  };

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!form.name.trim()) e.name = true;
    if (!form.contact.trim()) e.contact = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: part.id,
          partPn: part.pn,
          name: form.name,
          company: form.company,
          contact: form.contact,
          channel: form.channel,
          urgency: form.urgency,
          qty: form.qty ? Number(form.qty) : null,
          cond: form.cond,
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { ticket: string };
      trackEvent({
        event_name: "rfq_submitted",
        part_pn: part.pn,
        channel: form.channel,
        metadata: {
          urgency: form.urgency,
          qty: form.qty ? Number(form.qty) : null,
        },
      });
      setResult({ ticket: data.ticket });
    } catch {
      setServerError("Something went wrong sending your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return <Success part={part} urgency={form.urgency} channel={form.channel} ticket={result.ticket} />;
  }

  return (
    <div className="rfq-panel">
      <div className={"rfq-top" + (form.urgency === "down" ? " urgent-mode" : "")}>
        <div className="rfq-title">
          {form.urgency === "down" ? <Ic.bolt /> : <Ic.doc />}
          Request availability quote
        </div>
        <div className="rfq-sub">
          For{" "}
          <span className="mono" style={{ color: "var(--ink)", fontWeight: 600 }}>
            {part.pn}
          </span>{" "}
          — no payment now. We locate it, test it, and quote you.
        </div>
      </div>

      <div className="rfq-body">
        {/* urgency */}
        <div className="field">
          <label>
            Machine status <span className="req">*</span>
          </label>
          <div className="seg">
            <div
              className={"seg-opt urgent" + (form.urgency === "down" ? " on urgent" : "")}
              onClick={() => set("urgency", "down")}
            >
              <span className="st">
                <span className="ic" />
                Line down
              </span>
              <span className="sd">Emergency · prioritized</span>
            </div>
            <div
              className={"seg-opt" + (form.urgency === "spare" ? " on" : "")}
              onClick={() => set("urgency", "spare")}
            >
              <span className="st">
                <span className="ic" />
                Stocking spares
              </span>
              <span className="sd">Planning ahead</span>
            </div>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Quantity</label>
            <input
              value={form.qty}
              onChange={(e) => set("qty", e.target.value)}
              type="number"
              min="1"
            />
          </div>
          <div className="field">
            <label>Condition</label>
            <select value={form.cond} onChange={(e) => set("cond", e.target.value)}>
              <option value="any">Any tested unit</option>
              <option value="refurb">Refurbished only</option>
              <option value="exchange">Core exchange</option>
            </select>
          </div>
        </div>

        {/* contact channel */}
        <div className="field">
          <label>
            Contact channel <span className="req">*</span>
          </label>
          <div className="chan">
            {CHANNELS.map((c) => (
              <div
                key={c.id}
                className={"chan-opt" + (form.channel === c.id ? " on" : "")}
                onClick={() => set("channel", c.id)}
              >
                {c.icon}
                {c.id}
              </div>
            ))}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>
              Name <span className="req">*</span>
            </label>
            <input
              className={errors.name ? "err" : ""}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your name"
            />
            {errors.name && <span className="errmsg">Required</span>}
          </div>
          <div className="field">
            <label>Company</label>
            <input
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Plant / integrator"
            />
          </div>
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

        <div className="field">
          <label>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Serial / firmware revision, host system, deadline…"
          />
        </div>
      </div>

      <div className="rfq-foot">
        <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={submitting}>
          <Ic.bolt />{" "}
          {submitting
            ? "Sending…"
            : form.urgency === "down"
              ? "Send priority request"
              : "Request quote"}
        </button>
        {serverError && (
          <div className="errmsg" style={{ marginTop: 10, textAlign: "center" }}>
            {serverError}
          </div>
        )}
        <div className="rfq-assure">
          <Ic.shield /> Verified-refurb guarantee · no payment until you approve the quote
        </div>
      </div>
    </div>
  );
}
