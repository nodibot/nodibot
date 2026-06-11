"use client";

import { Header } from "@/app/_components/header";

export default function CatalogError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="app">
      <Header variant="app" />
      <div className="wrap" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2 className="results-title" style={{ marginBottom: 10 }}>
          Couldn&apos;t load the catalog
        </h2>
        <p className="results-sub" style={{ marginBottom: 22 }}>
          Something went wrong reaching our inventory. Please try again.
        </p>
        <button className="btn btn-primary" onClick={reset}>
          Retry
        </button>
      </div>
    </div>
  );
}
