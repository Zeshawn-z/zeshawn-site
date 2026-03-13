"use client";

import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import { useSpotlightMouse } from "./SpotlightSection";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
}

export default function GlowCard({ children, className = "" }: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlight = useSpotlightMouse();

  // Local hover state for the inner glow
  const [localPos, setLocalPos] = useState({ x: 0, y: 0 });
  const [isDirectHover, setIsDirectHover] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      setLocalPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    []
  );

  // Border background: always starts as border color, blends highlight near mouse
  const [borderBg, setBorderBg] = useState("var(--border)");

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !spotlight.active) {
      setBorderBg("var(--border)");
      return;
    }

    const rect = card.getBoundingClientRect();

    // Mouse position relative to card top-left (for radial-gradient placement)
    const relX = spotlight.x - rect.left;
    const relY = spotlight.y - rect.top;

    // Distance from mouse to nearest card edge
    const distX = Math.max(
      0,
      Math.max(rect.left - spotlight.x, spotlight.x - rect.right)
    );
    const distY = Math.max(
      0,
      Math.max(rect.top - spotlight.y, spotlight.y - rect.bottom)
    );
    const distToEdge = Math.sqrt(distX * distX + distY * distY);

    const maxDist = 150;
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

    // Radial gradient: mouse-nearby border brightens from base border color to muted gray
    setBorderBg(
      `radial-gradient(250px circle at ${relX}px ${relY}px, ` +
        `color-mix(in srgb, var(--muted) ${Math.round(70 * intensity)}%, var(--border)), ` +
        `color-mix(in srgb, var(--muted) ${Math.round(25 * intensity)}%, var(--border)) 40%, ` +
        `var(--border) 70%)`
    );
  }, [spotlight]);

  // Inner glow — only when directly hovering (blue accent)
  const innerGlow = `radial-gradient(300px circle at ${localPos.x}px ${localPos.y}px, rgba(59,130,246,0.10), transparent 50%)`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsDirectHover(true)}
      onMouseLeave={() => setIsDirectHover(false)}
      className="rounded-xl p-px"
      style={{ background: borderBg }}
    >
      {/* Card body */}
      <div
        className={`relative overflow-hidden rounded-[11px] bg-card ${className}`}
      >
        {/* Inner ambient glow — only on direct hover */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-200"
          style={{
            opacity: isDirectHover ? 1 : 0,
            background: innerGlow,
          }}
        />
        <div className="relative z-[2]">{children}</div>
      </div>
    </div>
  );
}
