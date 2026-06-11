import { Header } from "@/app/_components/header";

export default function Loading() {
  return (
    <div className="app">
      <Header variant="app" />
      <div className="wrap" style={{ padding: "80px 0", textAlign: "center", color: "var(--muted)" }}>
        Loading inventory…
      </div>
    </div>
  );
}
