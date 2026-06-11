import Link from "next/link";
import { Header } from "@/app/_components/header";
import { Footer } from "@/app/_components/footer";
import { Ic } from "@/app/_components/icons";

export default function PartNotFound() {
  return (
    <div className="app">
      <Header variant="app" />
      <div className="wrap" style={{ padding: "90px 0", textAlign: "center", maxWidth: 620 }}>
        <h1 className="results-title" style={{ fontSize: 30, marginBottom: 12 }}>
          Not indexed yet — but we can still source it.
        </h1>
        <p className="results-sub" style={{ fontSize: 15, marginBottom: 28 }}>
          We don&apos;t have this exact part in our catalog. Our desk can still hunt it across our
          verified China supply network — send us the number and we&apos;ll quote you.
        </p>
        <div className="cta-row" style={{ justifyContent: "center" }}>
          <Link className="btn btn-primary btn-lg" href="/catalog">
            <Ic.search /> Search the catalog
          </Link>
          <Link className="btn btn-ghost btn-lg" href="/catalog">
            <Ic.doc /> Request a quote
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
