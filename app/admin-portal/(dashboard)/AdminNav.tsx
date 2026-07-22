"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ic } from "@/app/_components/icons";

const LINKS = [
  { href: "/admin-portal/products", label: "Inventory", icon: <Ic.cube /> },
  { href: "/admin-portal/inquiries", label: "Inquiries", icon: <Ic.doc /> },
  { href: "/admin-portal/analytics-demand", label: "Demand / buy list", icon: <Ic.spark /> },
  { href: "/admin-portal/analytics-traffic", label: "Traffic analytics", icon: <Ic.search /> },
  { href: "/admin-portal/outreach", label: "Outreach", icon: <Ic.spark /> },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          prefetch={false}
          className={pathname.startsWith(l.href) ? "on" : ""}
        >
          {l.icon}
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
