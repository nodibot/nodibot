// nodibot "reach arm" logomark — an articulated robot arm of nodes reaching a
// lit accent node. Self-contained tile (own background); consistent on light
// and dark surfaces. Ported from the brand lockup SVG.

export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" fill="#15171b" />
      <line
        x1="7.5"
        y1="24"
        x2="14"
        y2="24"
        stroke="#f6f6f3"
        strokeWidth="1.6"
        strokeOpacity="0.32"
        strokeLinecap="round"
      />
      <path
        d="M10.5 23 L14.5 15.5 L21 10.5"
        fill="none"
        stroke="#f6f6f3"
        strokeWidth="2.2"
        strokeOpacity="0.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10.5" cy="23" r="2.4" fill="#f6f6f3" />
      <circle cx="14.5" cy="15.5" r="2.7" fill="#15171b" stroke="#f6f6f3" strokeWidth="1.8" />
      <circle cx="21.5" cy="10" r="3.2" fill="var(--accent)" />
    </svg>
  );
}

// "nodibot" wordmark — the "i" lit in the accent color.
export function Wordmark() {
  return (
    <div className="brand-name">
      nod<span className="dot">i</span>bot
    </div>
  );
}
