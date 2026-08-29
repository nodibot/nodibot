// Fixed reference taxonomy — categories, host systems, condition labels.
// This is stable data the admin never edits, so it lives in code (not the DB).

export interface Category {
  id: string;
  label: string;
  tier: string;
  blurb: string;
}

export interface Host {
  id: string;
  label: string;
  systems: string;
  arms: string;
}

// Functional pillars. Robots (whole arms) lead; the rest are spare-part pillars.
export const CATEGORIES: Category[] = [
  { id: "robots", label: "Industrial Robots", tier: "Whole arms", blurb: "Refurbished ABB IRB robots by payload & reach" },
  { id: "controllers", label: "Controllers & Computing", tier: "The brain", blurb: "PLC cards, axis computers, comms blocks" },
  { id: "hmi", label: "HMIs & Displays", tier: "Daily wear", blurb: "Teach pendants, touchscreens, operator panels" },
  { id: "motion", label: "Motion & Drive Systems", tier: "Urgent panic", blurb: "Servo drives, amplifiers, inverters, motors" },
  { id: "mechanical", label: "Heavy Mechanical", tier: "Structural value", blurb: "RV reducers, harmonic drives, gearboxes" },
  { id: "consumables", label: "Consumables & Infrastructure", tier: "High turnover", blurb: "Sensors, connectors, safety, vision" },
];

// Host systems (machines parts are salvaged from / fit into).
// Inventory is currently ABB-only (real supplier stock), so ABB is the sole host.
export const HOSTS: Host[] = [
  { id: "abb", label: "ABB", systems: "S4C+ · IRC5 · OmniCore", arms: "IRB 120, 1200, 1600, 2400, 2600, 4600, 6640, 6700" },
];

// Condition labels.
export const COND: Record<string, string> = {
  tested: "Tested & verified",
  refurb: "Professionally refurbished",
  asis: "As-removed, functional",
};

// Short labels for placeholder imagery, keyed by category.
export const PH_LABEL: Record<string, string> = {
  robots: "robot arm",
  controllers: "PLC / processor",
  hmi: "teach pendant",
  motion: "servo drive",
  mechanical: "gear reducer",
  consumables: "sensor / module",
};

export const CAT_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
);

export const HOST_BY_ID: Record<string, Host> = Object.fromEntries(
  HOSTS.map((h) => [h.id, h]),
);
