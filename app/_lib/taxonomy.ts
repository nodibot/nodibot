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

// Five functional pillars.
export const CATEGORIES: Category[] = [
  { id: "controllers", label: "Controllers & Computing", tier: "The brain", blurb: "PLC cards, axis computers, comms blocks" },
  { id: "hmi", label: "HMIs & Displays", tier: "Daily wear", blurb: "Teach pendants, touchscreens, operator panels" },
  { id: "motion", label: "Motion & Drive Systems", tier: "Urgent panic", blurb: "Servo drives, amplifiers, inverters, motors" },
  { id: "mechanical", label: "Heavy Mechanical", tier: "Structural value", blurb: "RV reducers, harmonic drives, gearboxes" },
  { id: "consumables", label: "Consumables & Infrastructure", tier: "High turnover", blurb: "Sensors, connectors, safety, vision" },
];

// Host systems (machines parts are salvaged from / fit into).
export const HOSTS: Host[] = [
  { id: "fanuc", label: "FANUC", systems: "R-J3 · R-30iA · R-30iB", arms: "M-20iA, M-710iC, R-2000iC, LR Mate, ARC Mate" },
  { id: "abb", label: "ABB", systems: "S4C+ · IRC5 · OmniCore", arms: "IRB 1600, 2400, 2600, 4600, 6640, 6700" },
  { id: "yaskawa", label: "Yaskawa / Motoman", systems: "NX100 · DX100 · DX200 · YRC1000", arms: "HP20, MH50, MH180, GP25, GP50" },
  { id: "kuka", label: "KUKA", systems: "KRC2 · KRC4", arms: "KR16, KR60, KR150, KR210, KR360" },
  { id: "mitsubishi", label: "Mitsubishi", systems: "CR · FR · MELFA", arms: "RV-7FL, RV-13FR, RV-20FR, RV-35F" },
  { id: "siemens", label: "Siemens", systems: "S7-300 · S7-1500 · Sinamics", arms: "Line control & motion platforms" },
  { id: "ab", label: "Allen-Bradley", systems: "ControlLogix · CompactLogix", arms: "PanelView & Logix platforms" },
];

// Condition labels.
export const COND: Record<string, string> = {
  tested: "Tested & verified",
  refurb: "Professionally refurbished",
  asis: "As-removed, functional",
};

// Short labels for placeholder imagery, keyed by category.
export const PH_LABEL: Record<string, string> = {
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
