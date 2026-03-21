import type { MetadataRoute } from "next";
import { getDynamicSiteConfig } from "@/lib/config/site-config-dynamic";
import { getAllPosts } from "@/lib/db/data";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const cfg = getDynamicSiteConfig();
  const baseUrl = cfg.url || "https://example.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/guestbook`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
  ];

  const posts = getAllPosts();
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}
