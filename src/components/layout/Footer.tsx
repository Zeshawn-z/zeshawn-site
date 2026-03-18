"use client";

import { useRouter } from "next/navigation";
import { Github, Twitter, Mail } from "lucide-react";
import { useSiteConfig } from "@/components/layout/SiteConfigProvider";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  github: Github,
  twitter: Twitter,
  email: Mail,
};

export default function Footer() {
  const router = useRouter();
  const siteConfig = useSiteConfig();
  const socialEntries = Object.entries(siteConfig.social).filter(
    ([, url]) => url
  );

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row lg:px-8">
        <p
          className="select-none text-sm text-muted"
          onDoubleClick={() => router.push("/admin")}
        >
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          {socialEntries.map(([key, href]) => {
            const Icon = iconMap[key];
            if (!Icon) return null;
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted transition-colors hover:text-foreground"
                aria-label={key}
              >
                <Icon size={18} />
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
