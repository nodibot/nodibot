import type { ReactNode } from "react";
import { buildWhatsAppHref } from "@/app/_lib/whatsapp";

type WaChatLinkProps = {
  className?: string;
  partPn?: string;
  message?: string;
  children: ReactNode;
  fallbackTitle?: string;
};

// Server-safe WhatsApp click-to-chat link. Renders children inert when env is unset.
export function WaChatLink({
  className,
  partPn,
  message,
  children,
  fallbackTitle = "WhatsApp chat (configure NEXT_PUBLIC_WHATSAPP_URL)",
}: WaChatLinkProps) {
  const href = buildWhatsAppHref({ partPn, message });

  if (!href) {
    return (
      <span className={className} title={fallbackTitle} aria-disabled="true">
        {children}
      </span>
    );
  }

  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
