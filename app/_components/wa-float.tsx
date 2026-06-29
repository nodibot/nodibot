"use client";

import { useTranslations } from "next-intl";
import { buildContactEmailHref } from "@/app/_lib/contact-email";
import { buildWhatsAppHref } from "@/app/_lib/whatsapp";
import { trackEvent } from "@/app/_lib/analytics-client";
import { Ic } from "./icons";

export function WaFloat({ partPn }: { partPn?: string }) {
  const t = useTranslations("Contact");
  const emailHref = buildContactEmailHref({ partPn });
  const href = buildWhatsAppHref({ partPn });

  return (
    <div className="contact-floats">
      {emailHref && (
        <a
          className="email-float"
          href={emailHref}
          onClick={() => trackEvent({ event_name: "email_click", part_pn: partPn, metadata: { surface: "email_float" } })}
        >
          <Ic.mail /> {t("emailUs")}
        </a>
      )}

      {href ? (
        <a
          className="wa-float"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent({ event_name: "whatsapp_click", part_pn: partPn, metadata: { surface: "wa_float" } })}
        >
          <Ic.whatsapp /> {t("chatToSource")}
        </a>
      ) : (
        <button
          className="wa-float"
          title="WhatsApp chat (configure NEXT_PUBLIC_WHATSAPP_URL)"
          onClick={(e) => e.preventDefault()}
        >
          <Ic.whatsapp /> {t("chatToSource")}
        </button>
      )}
    </div>
  );
}
