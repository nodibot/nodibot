// The 28 curated parts from the prototype, shaped as `parts` table rows.
// Consumed by supabase/seed.ts.

export interface SeedPart {
  id: string;
  cat: string;
  brand: string;
  pn: string;
  name: string;
  life: string;
  cond: string;
  stock: "in" | "request";
  qty: number | null;
  lead: string;
  hosts: string[];
  views: number;
}

export const SEED_PARTS: SeedPart[] = [
  // ---- Controllers & Computing ----
  { id: "ctl-01", cat: "controllers", brand: "Siemens", pn: "6ES7315-2AH14-0AB0", name: "CPU 315-2 DP Central Processing Unit", life: "Discontinued", hosts: ["siemens"], cond: "refurb", stock: "request", qty: null, lead: "3–6 days", views: 412 },
  { id: "ctl-02", cat: "controllers", brand: "Allen-Bradley", pn: "1756-L73", name: "ControlLogix 5573 8MB High-Memory Processor", life: "Mature", hosts: ["ab"], cond: "tested", stock: "in", qty: 4, lead: "Ships today", views: 688 },
  { id: "ctl-03", cat: "controllers", brand: "ABB", pn: "3HAC050363-001", name: "DSQC 1018 Main Controller System Computer", life: "Discontinued", hosts: ["abb"], cond: "refurb", stock: "request", qty: null, lead: "5–9 days", views: 905 },
  { id: "ctl-04", cat: "controllers", brand: "Fanuc", pn: "A02B-0333-B802", name: "FS30i-B Main Core CNC Controller Rack", life: "Phase-Out", hosts: ["fanuc"], cond: "tested", stock: "request", qty: null, lead: "7–12 days", views: 1147 },
  { id: "ctl-05", cat: "controllers", brand: "Mitsubishi", pn: "Q03UDVCPU", name: "High-Speed Universal Q-Series PLC CPU", life: "Active", hosts: ["mitsubishi"], cond: "tested", stock: "in", qty: 7, lead: "Ships today", views: 322 },
  { id: "ctl-06", cat: "controllers", brand: "Allen-Bradley", pn: "1756-L85E", name: "ControlLogix 5580 40MB Processor", life: "Active", hosts: ["ab"], cond: "tested", stock: "request", qty: null, lead: "4–8 days", views: 540 },

  // ---- HMIs & Displays ----
  { id: "hmi-01", cat: "hmi", brand: "ABB", pn: "3HAC028357-001", name: "DSQC 679 FlexPendant Teach Pendant", life: "Discontinued", hosts: ["abb"], cond: "refurb", stock: "request", qty: null, lead: "5–10 days", views: 2031 },
  { id: "hmi-02", cat: "hmi", brand: "Fanuc", pn: "A05B-2518-C202", name: "R-30iB Slim Lightweight iPendant", life: "Active", hosts: ["fanuc"], cond: "tested", stock: "request", qty: null, lead: "4–8 days", views: 1782 },
  { id: "hmi-03", cat: "hmi", brand: "KUKA", pn: "00-168-334", name: "KCP4 smartPAD Robotic Teach Pendant", life: "Active", hosts: ["kuka"], cond: "refurb", stock: "in", qty: 2, lead: "Ships today", views: 1604 },
  { id: "hmi-04", cat: "hmi", brand: "Siemens", pn: "6AV2124-0MC01-0AX0", name: "Simatic TP1200 Comfort Touch Panel", life: "Active", hosts: ["siemens"], cond: "tested", stock: "request", qty: null, lead: "3–6 days", views: 611 },
  { id: "hmi-05", cat: "hmi", brand: "Allen-Bradley", pn: "2711P-T10C21D8S", name: "PanelView Plus 7 10.4\" Touch Display", life: "Active", hosts: ["ab"], cond: "tested", stock: "request", qty: null, lead: "4–7 days", views: 733 },
  { id: "hmi-06", cat: "hmi", brand: "Yaskawa Motoman", pn: "153724-1CD", name: "DX200 Functional Touchscreen Pendant", life: "Active", hosts: ["yaskawa"], cond: "refurb", stock: "request", qty: null, lead: "6–11 days", views: 1290 },

  // ---- Motion & Drive Systems ----
  { id: "mot-01", cat: "motion", brand: "Fanuc", pn: "A06B-6114-H206", name: "Alpha i SVM2-40/40i Dual-Axis Servo Amp", life: "Discontinued", hosts: ["fanuc"], cond: "tested", stock: "request", qty: null, lead: "5–9 days", views: 1455 },
  { id: "mot-02", cat: "motion", brand: "Yaskawa", pn: "SGD7S-5R5A00A", name: "Sigma-7 750W Single-Axis Servo Amp", life: "Active", hosts: ["yaskawa"], cond: "tested", stock: "in", qty: 11, lead: "Ships today", views: 498 },
  { id: "mot-03", cat: "motion", brand: "Mitsubishi", pn: "MR-J4-40B", name: "SSCNET III/H 400W Servo Drive Unit", life: "Active", hosts: ["mitsubishi"], cond: "tested", stock: "in", qty: 9, lead: "Ships today", views: 377 },
  { id: "mot-04", cat: "motion", brand: "ABB", pn: "3HAC029818-001", name: "DSQC 663 Single-Drive Inverter Axis Unit", life: "Discontinued", hosts: ["abb"], cond: "refurb", stock: "request", qty: null, lead: "6–10 days", views: 962 },
  { id: "mot-05", cat: "motion", brand: "Fanuc", pn: "A06B-6240-H106", name: "Alpha iSV 1-160HV High-Voltage Servo Amp", life: "Active", hosts: ["fanuc"], cond: "tested", stock: "request", qty: null, lead: "7–12 days", views: 814 },
  { id: "mot-06", cat: "motion", brand: "Siemens", pn: "6SL3120-2TE21-0AA4", name: "Sinamics S120 Double Motor Drive Module", life: "Active", hosts: ["siemens"], cond: "tested", stock: "request", qty: null, lead: "4–8 days", views: 605 },

  // ---- Heavy Mechanical ----
  { id: "mec-01", cat: "mechanical", brand: "Nabtesco", pn: "RV-40E", name: "Precision Robot Main Axis Flanged Reducer", life: "Active", hosts: ["fanuc", "abb", "yaskawa", "kuka"], cond: "refurb", stock: "request", qty: null, lead: "8–14 days", views: 1188 },
  { id: "mec-02", cat: "mechanical", brand: "Harmonic Drive", pn: "HFUC-20-100-2A-GR", name: "Strain-Wave Flexspline Wrist Gear Set", life: "Active", hosts: ["fanuc", "kuka", "mitsubishi"], cond: "refurb", stock: "request", qty: null, lead: "6–11 days", views: 642 },
  { id: "mec-03", cat: "mechanical", brand: "Wittenstein Alpha", pn: "SP075S-MF1-5-1C1", name: "Ultra-Low Backlash Inline Planetary Gearbox", life: "Active", hosts: ["siemens", "ab"], cond: "tested", stock: "in", qty: 3, lead: "Ships today", views: 288 },
  { id: "mec-04", cat: "mechanical", brand: "Nabtesco", pn: "RV-320C", name: "Ultra-Heavy Axis 2/3 Cycloidal Joint Reducer", life: "Active", hosts: ["abb", "kuka", "yaskawa"], cond: "refurb", stock: "request", qty: null, lead: "10–18 days", views: 521 },
  { id: "mec-05", cat: "mechanical", brand: "Apex Dynamics", pn: "AB090-010-S1-P2", name: "High-Precision Stainless Mechanical Gearbox", life: "Active", hosts: ["siemens", "ab", "mitsubishi"], cond: "tested", stock: "in", qty: 6, lead: "Ships today", views: 196 },

  // ---- Consumables & Infrastructure ----
  { id: "con-01", cat: "consumables", brand: "Harting", pn: "09330162601", name: "Han 16 E Male Terminal Screw Insert", life: "Active", hosts: ["fanuc", "abb", "kuka", "yaskawa"], cond: "tested", stock: "in", qty: 140, lead: "Ships today", views: 142 },
  { id: "con-02", cat: "consumables", brand: "Omron", pn: "E2E-X10D1-N", name: "Universal Proximity Sensor M30 Thread", life: "Active", hosts: ["fanuc", "abb", "mitsubishi", "yaskawa"], cond: "tested", stock: "in", qty: 88, lead: "Ships today", views: 167 },
  { id: "con-03", cat: "consumables", brand: "Keyence", pn: "PR-M30N1", name: "High-Precision Unshielded M30 Inductive Sensor", life: "Active", hosts: ["fanuc", "kuka"], cond: "tested", stock: "in", qty: 42, lead: "Ships today", views: 134 },
  { id: "con-04", cat: "consumables", brand: "Sick", pn: "microScan3-Core", name: "Safety Laser Protection Scanner Hub", life: "Active", hosts: ["abb", "kuka", "yaskawa"], cond: "tested", stock: "request", qty: null, lead: "5–9 days", views: 712 },
  { id: "con-05", cat: "consumables", brand: "Cognex", pn: "In-Sight 7802M", name: "Smart Machine Vision System Camera", life: "Active", hosts: ["fanuc", "abb", "ab"], cond: "tested", stock: "request", qty: null, lead: "4–8 days", views: 836 },
  { id: "con-06", cat: "consumables", brand: "Keyence", pn: "SR-2000", name: "Ultra-Wide FOV Industrial 2D Code Reader", life: "Active", hosts: ["fanuc", "siemens"], cond: "tested", stock: "request", qty: null, lead: "5–9 days", views: 459 },
];
