import Link from "next/link";
import { LogoMark } from "./logo";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <Link href="/" className="brand">
          <LogoMark />
          <div className="brand-name">
            nod<span className="dot">i</span>bot
          </div>
        </Link>
        <div className="muted">
          Secondary-market industrial automation · Verified-refurb guarantee · © 2026
        </div>
      </div>
    </footer>
  );
}
