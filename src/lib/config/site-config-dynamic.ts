// Server-only — reads from DB. The single source of truth for site config.
import { getSiteConfig as getDbConfig } from "@/lib/db/data";
import type { SiteConfigData } from "@/components/layout/SiteConfigProvider";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/projects", label: "项目" },
  { href: "/blog", label: "博客" },
  { href: "/guestbook", label: "留言" },
  { href: "/about", label: "关于" },
];

type LogoChoice = "light" | "dark" | "default";

function normalizeLogoChoice(value: string | undefined, fallback: LogoChoice): LogoChoice {
  if (value === "light" || value === "dark" || value === "default") {
    return value;
  }
  return fallback;
}

export function getDynamicSiteConfig() {
  const cfg = getDbConfig();
  const metaChoiceSource = cfg["branding.metaLogoChoice"] || cfg["branding.metaLogoVariant"];

  return {
    name: cfg["site.name"] || "Zeshawn",
    title: cfg["site.name"] || "Zeshawn",
    description: cfg["site.description"] || "",
    url: cfg["site.url"] || "",

    branding: {
      enabled: cfg["branding.enabled"] !== "false",
      logoLightUrl: cfg["branding.logoLightUrl"] || "",
      logoDarkUrl: cfg["branding.logoDarkUrl"] || "",
      lightThemeLogoChoice: normalizeLogoChoice(cfg["branding.lightThemeLogoChoice"], "light"),
      darkThemeLogoChoice: normalizeLogoChoice(cfg["branding.darkThemeLogoChoice"], "dark"),
      metaLogoChoice: normalizeLogoChoice(metaChoiceSource, "default"),
    },

    author: {
      name: cfg["author.name"] || "",
      bio: cfg["author.bio"] || "",
      avatar: "/avatar.jpg",
      location: cfg["author.location"] || "",
      email: cfg["author.email"] || "",
    },

    about: {
      intro: cfg["about.intro"] || "",
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
    branding: {
      enabled: full.branding.enabled,
      logoLightUrl: full.branding.logoLightUrl,
      logoDarkUrl: full.branding.logoDarkUrl,
      lightThemeLogoChoice: full.branding.lightThemeLogoChoice,
      darkThemeLogoChoice: full.branding.darkThemeLogoChoice,
    },
    social: full.social,
    nav: full.nav,
  };
}
