"use client";

import { useEffect, useState } from "react";
import { Sun, Monitor, Moon } from "lucide-react";

type Theme = "light" | "system" | "dark";

const themes: Theme[] = ["light", "system", "dark"];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved && themes.includes(saved)) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else if (t === "light") {
      root.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const switchTo = (t: Theme) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  };

  // Listen for system changes when in system mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  if (!mounted) {
    return <div className="h-7 w-[84px]" />;
  }

  const activeIndex = themes.indexOf(theme);

  return (
    <div
      className="relative flex h-7 items-center rounded-full border border-border bg-card p-0.5"
      role="radiogroup"
      aria-label="主题切换"
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-0.5 h-6 w-7 rounded-full bg-accent/15 transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${activeIndex * 28}px)`,
        }}
      />

      {themes.map((t, i) => {
        const Icon = t === "light" ? Sun : t === "dark" ? Moon : Monitor;
        const label = t === "light" ? "浅色" : t === "dark" ? "深色" : "跟随系统";
        const isActive = theme === t;

        return (
          <button
            key={t}
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => switchTo(t)}
            className={`relative z-10 flex h-6 w-7 items-center justify-center rounded-full transition-colors duration-200 ${
              isActive ? "text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            <Icon size={13} strokeWidth={2.2} />
          </button>
        );
      })}
    </div>
  );
}
