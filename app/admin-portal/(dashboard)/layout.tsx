import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoMark } from "@/app/_components/logo";
import { createSupabaseServerClient, getAdminUser } from "@/app/_lib/supabase-server";
import { AdminNav } from "./AdminNav";

async function logout() {
  "use server";
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin-portal/login");
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Middleware already guards these routes; this is defense-in-depth + gives us the email.
  const user = await getAdminUser();
  if (!user) redirect("/admin-portal/login");

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link href="/admin-portal/products" className="brand">
          <LogoMark />
          <div className="brand-name">
            nod<span className="dot">i</span>bot
          </div>
        </Link>

        <AdminNav />

        <div className="admin-side-foot">
          <div className="who">{user.email}</div>
          <form action={logout}>
            <button className="btn btn-ghost btn-sm btn-block" type="submit">
              Sign out
            </button>
          </form>
          <Link
            href="/"
            className="topbar-link"
            style={{ display: "inline-block", marginTop: 8, fontSize: 12.5 }}
          >
            ← View public site
          </Link>
        </div>
      </aside>

      <div className="admin-main">{children}</div>
    </div>
  );
}
