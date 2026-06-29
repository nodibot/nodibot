"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Ic } from "@/app/_components/icons";
import { trackEvent } from "@/app/_lib/analytics-client";
import { buildContactEmailHref } from "@/app/_lib/contact-email";
import { buildWhatsAppHref } from "@/app/_lib/whatsapp";
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
  const t = useTranslations("Rfq");

  return (
    <div className="rfq-success fade-in">
      <div className="check">
        <Ic.check />
      </div>
      <h3>{urgency === "down" ? t("successPriority") : t("successNormal")}</h3>
      <p>
        {t("successBody", { pn: part.pn })}{" "}
        <strong className="mono" style={{ color: "var(--ink)" }}>
          {part.pn}
        </strong>
        . {urgency === "down" ? t("lineDownResponse") : t("normalResponse")}
      </p>
      <div className="rfq-ticket">
        {t("reference", { ticket, channel })}
      </div>
      <div className="resp-pill" style={{ justifyContent: "center" }}>
        <span className="pulse" /> {t("deskOnline")}
      </div>
    </div>
  );
}

export function RfqForm({ part }: { part: Part }) {
  const t = useTranslations("Rfq");
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showDetails, setShowDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ticket: string } | null>(null);
  const whatsappHref = buildWhatsAppHref({ partPn: part.pn });
  const emailHref = buildContactEmailHref({ partPn: part.pn });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: false }));
  };

  const validate = () => {
    const e: Record<string, boolean> = {};
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
          name: form.name.trim() || "Website RFQ",
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
      setServerError(t("serverError"));
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
          {t("title")}
        </div>
        <div className="rfq-sub">
          For{" "}
          <span className="mono" style={{ color: "var(--ink)", fontWeight: 600 }}>
            {part.pn}
          </span>{" "}
          - {t("subtitle", { pn: part.pn })}
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
                trackEvent({ event_name: "whatsapp_click", part_pn: part.pn, metadata: { surface: "rfq_panel" } })
              }
            >
              <Ic.whatsapp /> {t("whatsappQuote")}
            </a>
          )}
          {emailHref && (
            <a
              className="btn btn-ghost btn-lg"
              href={emailHref}
              onClick={() => trackEvent({ event_name: "email_click", part_pn: part.pn, metadata: { surface: "rfq_panel" } })}
            >
              <Ic.mail /> {t("emailQuote")}
            </a>
          )}
        </div>

        <div className="rfq-or">{t("orContact")}</div>

        {/* contact channel */}
        <div className="field">
          <label>
            {t("contactChannel")} <span className="req">*</span>
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
            <label>{t("nameCompany")}</label>
            <input
              className={errors.name ? "err" : ""}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t("optional")}
            />
          </div>
          <div className="field">
            <label>
              {form.channel === "Email" ? t("workEmail") : form.channel === "Phone" ? t("phone") : t("whatsappNumber")}{" "}
              <span className="req">*</span>
            </label>
            <input
              className={errors.contact ? "err" : ""}
              value={form.contact}
              onChange={(e) => set("contact", e.target.value)}
              placeholder={form.channel === "Email" ? "you@factory.com" : "+86 138 0000 0000"}
            />
            {errors.contact && <span className="errmsg">{t("contactRequired")}</span>}
          </div>
        </div>

        <button className="rfq-details-toggle" type="button" onClick={() => setShowDetails((open) => !open)}>
          {showDetails ? t("hideDetails") : t("showDetails")}
        </button>

        {showDetails && (
          <div className="rfq-details">
            {/* urgency */}
            <div className="field">
              <label>{t("machineStatus")}</label>
              <div className="seg">
                <div
                  className={"seg-opt urgent" + (form.urgency === "down" ? " on urgent" : "")}
                  onClick={() => set("urgency", "down")}
                >
                  <span className="st">
                    <span className="ic" />
                    {t("lineDown")}
                  </span>
                  <span className="sd">{t("lineDownDesc")}</span>
                </div>
                <div
                  className={"seg-opt" + (form.urgency === "spare" ? " on" : "")}
                  onClick={() => set("urgency", "spare")}
                >
                  <span className="st">
                    <span className="ic" />
                    {t("spares")}
                  </span>
                  <span className="sd">{t("sparesDesc")}</span>
                </div>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>{t("quantity")}</label>
                <input
                  value={form.qty}
                  onChange={(e) => set("qty", e.target.value)}
                  type="number"
                  min="1"
                />
              </div>
              <div className="field">
                <label>{t("condition")}</label>
                <select value={form.cond} onChange={(e) => set("cond", e.target.value)}>
                  <option value="any">{t("anyTested")}</option>
                  <option value="refurb">{t("refurbOnly")}</option>
                  <option value="exchange">{t("exchange")}</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>{t("company")}</label>
              <input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder={t("companyPlaceholder")}
              />
            </div>

            <div className="field">
              <label>{t("notes")}</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder={t("notesPlaceholder")}
              />
            </div>
          </div>
        )}
      </div>

      <div className="rfq-foot">
        <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={submitting}>
          <Ic.bolt />{" "}
          {submitting
            ? t("sending")
            : form.urgency === "down"
              ? t("sendPriority")
              : t("requestQuote")}
        </button>
        {serverError && (
          <div className="errmsg" style={{ marginTop: 10, textAlign: "center" }}>
            {serverError}
          </div>
        )}
        <div className="rfq-assure">
          <Ic.shield /> {t("assurance")}
        </div>
      </div>
    </div>
  );
}
