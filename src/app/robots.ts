import type { MetadataRoute } from "next";
import { getDynamicSiteConfig } from "@/lib/config/site-config-dynamic";

export default function robots(): MetadataRoute.Robots {
  const cfg = getDynamicSiteConfig();
  const baseUrl = cfg.url || "https://example.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
