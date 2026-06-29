import type { Metadata } from "next";
import ProductPage, { generateMetadata as generateProductMetadata } from "../../../products/[pn]/page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; pn: string }>;
}): Promise<Metadata> {
  const { pn } = await params;
  return generateProductMetadata({ params: Promise.resolve({ pn }) });
}

export default async function LocalizedProductPage({
  params,
}: {
  params: Promise<{ locale: string; pn: string }>;
}) {
  const { pn } = await params;
  return ProductPage({ params: Promise.resolve({ pn }) });
}
