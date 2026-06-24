import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/app/_lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin-portal/", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
