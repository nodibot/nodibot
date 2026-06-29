// Small presentational pieces ported from util.jsx.
import Image from "next/image";
import { useTranslations } from "next-intl";
import { PH_LABEL } from "@/app/_lib/taxonomy";
import type { Part } from "@/app/_lib/types";

export function PartImage({ part, className }: { part: Part; className?: string }) {
  const t = useTranslations("Common");

  if (part.imageStatus === "approved" && part.imageUrl) {
    return (
      <div className={"ph " + (className || "")}>
        <Image
          className="ph-img"
          src={part.imageUrl}
          alt={`${part.brand} ${part.pn}`}
          fill
          sizes="(max-width: 760px) 58px, 320px"
        />
      </div>
    );
  }

  return (
    <div className={"ph " + (className || "")}>
      <span className="ph-label">{PH_LABEL[part.cat] || t("partPhoto")}</span>
    </div>
  );
}

export function StockBadge({ part }: { part: Part }) {
  const t = useTranslations("Common");

  if (part.stock === "in") {
    return (
      <span className="badge badge-in">
        <span className="dot-s" style={{ background: "var(--in-stock)" }} />
        {t("inStockQty", { qty: part.qty ?? 0 })}
      </span>
    );
  }
  return (
    <span className="badge badge-req">
      <span className="dot-s" style={{ background: "var(--accent)" }} />
      {t("sourceOnRequest")}
    </span>
  );
}

export function LifeBadge({ life }: { life: string }) {
  return <span className="badge badge-life">{life}</span>;
}
