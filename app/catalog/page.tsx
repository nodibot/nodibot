import type { Metadata } from "next";
import { Header } from "@/app/_components/header";
import { Footer } from "@/app/_components/footer";
import { WaFloat } from "@/app/_components/wa-float";
import { CatalogView } from "@/app/_components/catalog/CatalogView";
import { getActiveParts } from "@/app/_lib/parts";

export const metadata: Metadata = {
  title: "Catalog — search secondary-market automation parts",
  description:
    "Search verified refurbished controllers, servo drives, teach pendants and reducers by exact part number. Filter by category, host system and availability.",
  alternates: {
    canonical: "/catalog",
  },
  openGraph: {
    title: "Catalog — search secondary-market automation parts",
    description:
      "Search nodibot's catalog of verified secondary-market controllers, drives, teach pendants, reducers, and automation modules by exact part number.",
    url: "/catalog",
    type: "website",
  },
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { q, cat } = params;
  const parts = await getActiveParts();

  return (
    <div className="app app-catalog">
      <Header variant="app" initialQuery={q ?? ""} key={q ?? ""} />
      <CatalogView
        parts={parts}
        initialQuery={q ?? ""}
        initialCat={cat ?? null}
        searchParams={params}
      />
      <Footer />
      <WaFloat />
    </div>
  );
}
