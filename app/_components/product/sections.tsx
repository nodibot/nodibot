// Product-detail sub-sections (server components). Ported from product.jsx.
import { useTranslations } from "next-intl";
import { CAT_LABEL, COND } from "@/app/_lib/taxonomy";
import type { Part } from "@/app/_lib/types";

export function Specs({ part }: { part: Part }) {
  const t = useTranslations("Product");
  const rows: [string, string, boolean][] = [
    [t("specPartNumber"), part.pn, true],
    // ...(part.alternativePns.length > 0
    //   ? [[t("specAlternative"), part.alternativePns.join(", "), true] as [string, string, boolean]]
    //   : []),
    [t("specManufacturer"), part.brand, false],
    [t("specCategory"), CAT_LABEL[part.cat], false],
    ...(part.categoryL2 ? [[t("specSubcategory"), part.categoryL2, false] as [string, string, boolean]] : []),
    // ...(part.series ? [[t("specSeries"), part.series, true] as [string, string, boolean]] : []),
    // ...(part.equipmentType ? [[t("specEquipment"), part.equipmentType, false] as [string, string, boolean]] : []),
    [t("specCondition"), COND[part.cond] ?? part.cond, false],
    // [t("specLifecycle"), part.life, false],
    // ...(part.controllerGeneration
    //   ? [[t("specGeneration"), part.controllerGeneration, false] as [string, string, boolean]]
    //   : []),
    [
      t("specAvailability"),
      part.availabilityLabel
        ?? (part.stock === "in"
          ? (part.qty != null ? t("stockAvailableQty", { qty: part.qty }) : t("stockAvailable"))
          : t("sourceOnRequest")),
      false,
    ],
    // [t("specLeadTime"), part.lead, false],
    // [t("specWarranty"), t("warrantyValue"), false],
  ];
  return (
    <div className="specs">
      {rows.map(([k, v, mono], i) => (
        <div className="spec-row" key={i}>
          <span className="k">{k}</span>
          <span className={"v" + (mono ? " mono" : "")}>{v}</span>
        </div>
      ))}
    </div>
  );
}
