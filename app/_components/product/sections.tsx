// Product-detail sub-sections (server components). Ported from product.jsx.
import { useTranslations } from "next-intl";
import { Ic } from "@/app/_components/icons";
import { CAT_LABEL, COND, HOST_BY_ID } from "@/app/_lib/taxonomy";
import type { Part } from "@/app/_lib/types";

export function AvailabilityPanel({ part }: { part: Part }) {
  const t = useTranslations("Product");
  const availability = part.availabilityLabel ?? (part.stock === "in" ? "In stock" : "Source on request");
  return (
    <div className="price-block">
      <div className="compat-h" style={{ marginBottom: 10 }}>
        <Ic.bolt /> {t("availabilityTitle")}
      </div>
      <div className="price-save" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
        <Ic.shield style={{ width: 15, height: 15, color: "var(--in-stock)" }} />
        <span>{t("availabilityBody", { availability })}</span>
      </div>
    </div>
  );
}

export function TrustStrip() {
  const t = useTranslations("Product");
  const items = [
    { icon: <Ic.shield />, title: t("tested"), desc: t("testedDesc") },
    { icon: <Ic.clock />, title: t("quoteFast"), desc: t("quoteFastDesc") },
    { icon: <Ic.globe />, title: t("ship"), desc: t("shipDesc") },
  ];
  return (
    <div className="trust">
      {items.map((it, i) => (
        <div className="trust-item" key={i}>
          {it.icon}
          <div className="t">{it.title}</div>
          <div className="d">{it.desc}</div>
        </div>
      ))}
    </div>
  );
}

export function Compat({ part }: { part: Part }) {
  const t = useTranslations("Product");
  const hosts = part.hosts.map((h) => HOST_BY_ID[h]).filter(Boolean);
  return (
    <div className="compat">
      <div className="compat-h">
        <Ic.link /> {t("compatTitle")}
      </div>
      <div className="compat-sub">{t("compatSub")}</div>
      <div className="compat-list">
        {part.compatibleControllers.length > 0 && (
          <div className="compat-row">
            <div className="h">
              <div className="b">{t("controllers")}</div>
              <div className="s mono">{t("fromData")}</div>
            </div>
            <div className="arms">{part.compatibleControllers.join(", ")}</div>
          </div>
        )}
        {part.compatibleRobotModels.length > 0 && (
          <div className="compat-row">
            <div className="h">
              <div className="b">{t("robotModels")}</div>
              <div className="s mono">{t("matchedModels")}</div>
            </div>
            <div className="arms">{part.compatibleRobotModels.join(", ")}</div>
          </div>
        )}
        {hosts.map((h) => (
          <div className="compat-row" key={h.id}>
            <div className="h">
              <div className="b">{h.label}</div>
              <div className="s mono">{h.systems}</div>
            </div>
            <div className="arms">{h.arms}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Specs({ part }: { part: Part }) {
  const t = useTranslations("Product");
  const rows: [string, string, boolean][] = [
    [t("specPartNumber"), part.pn, true],
    ...(part.alternativePns.length > 0
      ? [[t("specAlternative"), part.alternativePns.join(", "), true] as [string, string, boolean]]
      : []),
    [t("specManufacturer"), part.brand, false],
    [t("specCategory"), CAT_LABEL[part.cat], false],
    ...(part.categoryL2 ? [[t("specSubcategory"), part.categoryL2, false] as [string, string, boolean]] : []),
    ...(part.series ? [[t("specSeries"), part.series, true] as [string, string, boolean]] : []),
    ...(part.equipmentType ? [[t("specEquipment"), part.equipmentType, false] as [string, string, boolean]] : []),
    [t("specCondition"), COND[part.cond] ?? part.cond, false],
    // [t("specLifecycle"), part.life, false],
    // ...(part.controllerGeneration
    //   ? [[t("specGeneration"), part.controllerGeneration, false] as [string, string, boolean]]
    //   : []),
    [t("specLeadTime"), part.lead, false],
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
