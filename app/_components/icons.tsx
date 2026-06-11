// Shared inline SVG icon set (stroke-based, 24x24 viewBox). Ported from icons.jsx.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Ic = {
  search: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
  ),
  check: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2.4} {...p}><path d="M20 6 9 17l-5-5" /></svg>
  ),
  shield: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
  ),
  bolt: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /></svg>
  ),
  clock: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  cube: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v8" /></svg>
  ),
  link: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
  ),
  tag: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M20 12 12 4H4v8l8 8 8-8Z" /><circle cx="8" cy="8" r="1.4" fill="currentColor" /></svg>
  ),
  chevron: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="m9 18 6-6-6-6" /></svg>
  ),
  arrowR: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  ),
  whatsapp: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M17.5 14.4c-.3-.15-1.7-.84-2-.94-.26-.1-.46-.15-.65.15s-.74.93-.9 1.12c-.17.2-.33.22-.62.07a8.2 8.2 0 0 1-2.4-1.48 9 9 0 0 1-1.66-2.07c-.17-.3 0-.46.13-.6.13-.14.3-.34.44-.5.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.23-.56-.47-.48-.65-.49h-.55c-.2 0-.5.07-.77.37-.26.3-1 1-1 2.42s1.03 2.81 1.17 3c.15.2 2.03 3.1 4.92 4.35.69.3 1.22.47 1.64.6.69.22 1.31.19 1.8.12.55-.08 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.2-.55-.34M12 21.5a9.5 9.5 0 0 1-4.84-1.32l-.35-.2-3.6.94.96-3.5-.23-.36A9.5 9.5 0 1 1 12 21.5M12 2a11.5 11.5 0 0 0-9.86 17.4L1 23l3.7-1.1A11.5 11.5 0 1 0 12 2" /></svg>
  ),
  phone: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2" /></svg>
  ),
  mail: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></svg>
  ),
  x: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
  ),
  spark: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>
  ),
  doc: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></svg>
  ),
  truck: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M1 4h13v12H1zM14 8h4l3 3v5h-7" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>
  ),
  globe: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18" /></svg>
  ),
};

export type IconName = keyof typeof Ic;
