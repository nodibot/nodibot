import type { AdminPart, Inquiry } from "@/app/_lib/types";

export interface SourcingSearchLink {
  label: string;
  href: string;
  hint: string;
}

function compact(values: Array<string | null | undefined>): string {
  return values
    .map((v) => v?.trim())
    .filter(Boolean)
    .join(" ");
}

function enc(query: string): string {
  return encodeURIComponent(query);
}

export function buildSourcingQuery(inquiry: Inquiry, part: AdminPart | null): string {
  return compact([part?.brand, inquiry.part_pn ?? part?.pn, part?.name]);
}

export function buildChineseSourcingQuery(inquiry: Inquiry, part: AdminPart | null): string {
  return compact([
    inquiry.part_pn ?? part?.pn,
    part?.brand,
    part?.descriptionKr,
    part?.alternativePns[0],
  ]);
}

export function buildSourcingSearchLinks(inquiry: Inquiry, part: AdminPart | null): SourcingSearchLink[] {
  const query = buildSourcingQuery(inquiry, part) || inquiry.ticket;
  const cnQuery = buildChineseSourcingQuery(inquiry, part) || query;
  const googleQuery = `"${inquiry.part_pn ?? part?.pn ?? query}" (site:1688.com OR site:alibaba.com OR site:taobao.com)`;

  return [
    {
      label: "1688",
      href: `https://s.1688.com/selloffer/offer_search.htm?keywords=${enc(cnQuery)}`,
      hint: "Best first pass for Mainland supplier listings.",
    },
    {
      label: "Alibaba",
      href: `https://www.alibaba.com/trade/search?SearchText=${enc(query)}`,
      hint: "Useful for export-facing suppliers and English listings.",
    },
    {
      label: "Taobao",
      href: `https://s.taobao.com/search?q=${enc(cnQuery)}`,
      hint: "Good for spare parts and smaller resellers.",
    },
    {
      label: "Xianyu",
      href: `https://www.goofish.com/search?q=${enc(cnQuery)}`,
      hint: "Useful for surplus, used, and liquidation inventory.",
    },
    {
      label: "Google",
      href: `https://www.google.com/search?q=${enc(googleQuery)}`,
      hint: "Cross-check indexed marketplace listings.",
    },
  ];
}
