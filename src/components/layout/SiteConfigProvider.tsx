"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface SiteConfigData {
  name: string;
  branding: {
    enabled: boolean;
    logoLightUrl: string;
    logoDarkUrl: string;
    lightThemeLogoChoice: "light" | "dark" | "default";
    darkThemeLogoChoice: "light" | "dark" | "default";
  };
  social: {
    github: string;
    twitter: string;
    email: string;
  };
  nav: { href: string; label: string }[];
}

const SiteConfigContext = createContext<SiteConfigData>({
  name: "",
  branding: {
    enabled: true,
    logoLightUrl: "",
    logoDarkUrl: "",
    lightThemeLogoChoice: "light",
    darkThemeLogoChoice: "dark",
  },
  social: { github: "", twitter: "", email: "" },
  nav: [],
});

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

export default function SiteConfigProvider({
  value,
  children,
}: {
  value: SiteConfigData;
  children: ReactNode;
}) {
  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
}
