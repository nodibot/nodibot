"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/app/_components/logo";
import { createSupabaseBrowserClient } from "@/app/_lib/supabase-browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Invalid credentials. Check your email and password.");
      setBusy(false);
      return;
    }
    router.push("/admin-portal/products");
    router.refresh();
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="brand">
          <LogoMark />
          <div className="brand-name">
            nod<span className="dot">i</span>bot
          </div>
        </div>
        <h1>Sourcing desk</h1>
        <p className="sub">Admin access only.</p>

        <form className="admin-login-form" onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nodibot.io"
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <span className="errmsg">{error}</span>}
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
