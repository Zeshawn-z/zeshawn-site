"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"hidden" | "animating" | "done">("hidden");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setState("animating"), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  // After transition ends, remove transform/opacity so we don't create
  // a compositing layer that clips children's overflow (like GlowCard glow)
  useEffect(() => {
    if (state !== "animating") return;
    const el = ref.current;
    if (!el) return;

    const handler = () => setState("done");
    el.addEventListener("transitionend", handler, { once: true });

    // Fallback in case transitionend doesn't fire
    const timer = setTimeout(handler, 800);
    return () => {
      el.removeEventListener("transitionend", handler);
      clearTimeout(timer);
    };
  }, [state]);

  // "done" state: no inline styles at all → no compositing layer → no clipping
  if (state === "done") {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        state === "animating"
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
