// Presentation helpers for prices.

export const fmt = (n: number): string => "$" + n.toLocaleString("en-US");

export const priceRange = (r: [number, number]): string => `${fmt(r[0])} – ${fmt(r[1])}`;

// Percentage saved vs. OEM list, using the midpoint of the refurb range.
export const savePct = (refurb: [number, number], oem: number): number => {
  const mid = (refurb[0] + refurb[1]) / 2;
  return Math.round((1 - mid / oem) * 100);
};
