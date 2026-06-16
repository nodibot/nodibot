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
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const { q, cat } = await searchParams;
  const parts = await getActiveParts();

  return (
    <div className="app">
      <Header variant="app" initialQuery={q ?? ""} />
      <CatalogView parts={parts} initialQuery={q ?? ""} initialCat={cat ?? null} />
      <Footer />
      <WaFloat />
    </div>
  );
}
