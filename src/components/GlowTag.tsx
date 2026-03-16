"use client";

import { useRef, useState, useEffect } from "react";
import { useSpotlightMouse } from "./SpotlightSection";

interface GlowTagProps {
  children: string;
}

export default function GlowTag({ children }: GlowTagProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const spotlight = useSpotlightMouse();
  const [borderBg, setBorderBg] = useState("var(--border)");
  const [isHover, setIsHover] = useState(false);

  useEffect(() => {
    if (isHover) {
      setBorderBg("var(--accent)");
      return;
    }

    const el = ref.current;
    if (!el || !spotlight.active) {
      setBorderBg("var(--border)");
      return;
    }

    const rect = el.getBoundingClientRect();

    const relX = spotlight.x - rect.left;
    const relY = spotlight.y - rect.top;

    const distX = Math.max(0, Math.max(rect.left - spotlight.x, spotlight.x - rect.right));
    const distY = Math.max(0, Math.max(rect.top - spotlight.y, spotlight.y - rect.bottom));
    const distToEdge = Math.sqrt(distX * distX + distY * distY);

    const maxDist = 120;
    const proximity = distToEdge < maxDist ? 1 - distToEdge / maxDist : 0;

    const isInside =
      spotlight.x >= rect.left &&
      spotlight.x <= rect.right &&
      spotlight.y >= rect.top &&
      spotlight.y <= rect.bottom;

    const intensity = isInside ? 1 : proximity * proximity;

    if (intensity < 0.01) {
      setBorderBg("var(--border)");
      return;
    }

    setBorderBg(
      `radial-gradient(150px circle at ${relX}px ${relY}px, ` +
        `color-mix(in srgb, var(--muted) ${Math.round(70 * intensity)}%, var(--border)), ` +
        `color-mix(in srgb, var(--muted) ${Math.round(25 * intensity)}%, var(--border)) 40%, ` +
        `var(--border) 70%)`
    );
  }, [spotlight, isHover]);

  return (
    <span
      ref={ref}
      className="select-none rounded-full p-px"
      style={{ background: borderBg }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <span
        className="block rounded-full bg-background px-3 py-1 text-sm transition-colors"
        style={{ color: isHover ? "var(--accent)" : undefined }}
      >
        {children}
      </span>
    </span>
  );
}
