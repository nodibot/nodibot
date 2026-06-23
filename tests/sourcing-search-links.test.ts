import { describe, expect, it } from "vitest";
import { buildChineseSourcingQuery, buildSourcingSearchLinks } from "../app/_lib/sourcing/search-links";
import type { AdminPart, Inquiry } from "../app/_lib/types";

const inquiry: Inquiry = {
  id: "inq-1",
  part_id: "part-1",
  part_pn: "6ES7-321-1BH02",
  name: "Sam",
  company: "Acme",
  contact: "sam@example.com",
  channel: "Email",
  urgency: "down",
  qty: 1,
  cond: null,
  notes: null,
  status: "new",
  ticket: "RFQ-ABCD-1234",
  created_at: "2026-06-23T00:00:00Z",
};

const part = {
  id: "part-1",
  brand: "Siemens",
  pn: "6ES7-321-1BH02",
  name: "Digital input module",
  descriptionKr: "디지털 입력 모듈",
  alternativePns: ["6ES73211BH02"],
} as AdminPart;

describe("sourcing search links", () => {
  it("builds Chinese-oriented marketplace query context", () => {
    expect(buildChineseSourcingQuery(inquiry, part)).toContain("6ES7-321-1BH02");
    expect(buildChineseSourcingQuery(inquiry, part)).toContain("Siemens");
    expect(buildChineseSourcingQuery(inquiry, part)).toContain("디지털 입력 모듈");
  });

  it("builds marketplace links", () => {
    const links = buildSourcingSearchLinks(inquiry, part);
    expect(links.map((l) => l.label)).toEqual(["1688", "Alibaba", "Taobao", "Xianyu", "Google"]);
    expect(links[0].href).toContain("s.1688.com");
    expect(links[1].href).toContain("alibaba.com");
  });
});
