import type { Metadata } from "next";
import "./admin.css";

// Admin pages must never be indexed by search engines.
export const metadata: Metadata = {
  title: "nodibot Admin",
  robots: { index: false, follow: false },
};

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
