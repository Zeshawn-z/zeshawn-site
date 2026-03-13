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

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  if (!mounted) {
    return <div className="h-7 w-20" />;
  }

  const activeIndex = themes.indexOf(theme);

  return (
    <div
      className="flex h-7 w-20 items-center rounded-full border border-border bg-background p-[3px]"
      role="radiogroup"
      aria-label="主题切换"
    >
      <div className="relative flex h-full w-full items-center">
        {/* Filled pill slider */}
        <div
          className="absolute h-full rounded-full bg-foreground transition-[left] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{
            width: "calc(100% / 3)",
            left: `calc(${activeIndex} * 100% / 3)`,
          }}
        />

        {/* Buttons */}
        {themes.map((t) => {
          const Icon = t === "light" ? Sun : t === "dark" ? Moon : Monitor;
          const label =
            t === "light" ? "浅色" : t === "dark" ? "深色" : "跟随系统";
          const isActive = theme === t;

          return (
            <button
              key={t}
              role="radio"
              aria-checked={isActive}
              aria-label={label}
              title={label}
              onClick={() => switchTo(t)}
              className="relative z-10 flex h-full flex-1 items-center justify-center"
            >
              <Icon
                size={12}
                strokeWidth={2}
                className={`transition-colors duration-300 ${
                  isActive ? "text-background" : "text-muted hover:text-foreground"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
