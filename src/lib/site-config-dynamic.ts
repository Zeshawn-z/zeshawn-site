// Server-only — reads from DB. The single source of truth for site config.
import { getSiteConfig as getDbConfig } from "./data";
import type { SiteConfigData } from "@/components/SiteConfigProvider";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/projects", label: "项目" },
  { href: "/blog", label: "博客" },
  { href: "/guestbook", label: "留言" },
  { href: "/about", label: "关于" },
];

export function getDynamicSiteConfig() {
  const cfg = getDbConfig();
  return {
    name: cfg["site.name"] || "Zeshawn",
    title: cfg["site.name"] || "Zeshawn",
    description: cfg["site.description"] || "",
    url: cfg["site.url"] || "",

    author: {
      name: cfg["author.name"] || "",
      bio: cfg["author.bio"] || "",
      avatar: "/avatar.jpg",
      location: cfg["author.location"] || "",
      email: cfg["author.email"] || "",
    },

    hero: {
      greeting: cfg["hero.greeting"] || "你好，我是",
      name: cfg["hero.name"] || "",
      tagline: cfg["hero.tagline"] || "",
      description: cfg["hero.description"] || "",
    },

    social: {
      github: cfg["social.github"] || "",
      twitter: cfg["social.twitter"] || "",
      email: cfg["social.email"] || "",
    },

    nav: NAV,
  };
}

/** Subset safe to serialize and pass to client components via Context */
export function getClientSiteConfig(): SiteConfigData {
  const full = getDynamicSiteConfig();
  return {
    name: full.name,
    social: full.social,
    nav: full.nav,
  };
}
