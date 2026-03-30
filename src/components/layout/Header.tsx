"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, X, Terminal } from "lucide-react";
import { useSiteConfig } from "@/components/layout/SiteConfigProvider";
import ThemeToggle from "@/components/common/ThemeToggle";
import AdminQuickCreate from "@/components/layout/AdminQuickCreate";

export default function Header() {
  const siteConfig = useSiteConfig();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    ready: false,
  });

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const activeIndex = siteConfig.nav.findIndex((link) => isActive(link.href));

  const updateIndicator = useCallback(() => {
    const nav = navRef.current;
    const activeLink = linkRefs.current[activeIndex];
    if (!nav || !activeLink || activeIndex < 0) {
      setIndicator((prev) => ({ ...prev, ready: false }));
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    setIndicator({
      left: linkRect.left - navRect.left,
      width: linkRect.width,
      ready: true,
    });
  }, [activeIndex]);

  useEffect(() => {
    const raf = requestAnimationFrame(updateIndicator);
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener("resize", updateIndicator);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

  useEffect(() => {
    const root = document.documentElement;

    const syncTheme = () => {
      setIsDark(root.classList.contains("dark"));
    };

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const pickLogoUrl = (choice: "light" | "dark" | "default") => {
    if (!siteConfig.branding.enabled || choice === "default") return "";
    if (choice === "light") return siteConfig.branding.logoLightUrl || "";
    return siteConfig.branding.logoDarkUrl || "";
  };

  const activeChoice = isDark
    ? siteConfig.branding.darkThemeLogoChoice
    : siteConfig.branding.lightThemeLogoChoice;
  const logoSrc = pickLogoUrl(activeChoice);
  const hasCustomLogo = Boolean(logoSrc);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight transition-colors hover:text-accent"
        >
          {hasCustomLogo ? (
            <Image
              src={logoSrc}
              alt="Site logo"
              width={27}
              height={27}
              className="h-[27px] w-[27px] object-contain"
              unoptimized
              priority
            />
          ) : (
            <Terminal size={18} className="text-accent" />
          )}
          <span>{siteConfig.name}</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 sm:flex">
          <nav ref={navRef} className="relative flex items-center">
            {siteConfig.nav.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => {
                  linkRefs.current[i] = el;
                }}
                className={`relative z-10 px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                  isActive(link.href)
                    ? "text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Sliding indicator — sits at the very bottom edge of header */}
            <div
              className="absolute h-0.5 rounded-full bg-accent transition-all duration-300 ease-out"
              style={{
                bottom: -13,
                left: indicator.left,
                width: indicator.width,
                opacity: indicator.ready ? 1 : 0,
              }}
            />
          </nav>

          <div className="ml-3 border-l border-border pl-3">
            <div className="flex items-center gap-2">
              <AdminQuickCreate />
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Mobile: theme toggle + menu button */}
        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <button
            className="rounded-md p-1.5 text-muted transition-colors hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <nav className="border-t border-border px-6 py-3 sm:hidden">
          <AdminQuickCreate mobile />
          <div className="flex flex-col gap-1">
            {siteConfig.nav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive(link.href)
                    ? "font-medium text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  {isActive(link.href) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  )}
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
