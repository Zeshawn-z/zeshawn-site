"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";

interface SpotlightSectionProps {
  children: ReactNode;
  className?: string;
}

export default function SpotlightSection({
  children,
  className = "",
}: SpotlightSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [spotPos, setSpotPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setSpotPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative ${className}`}
    >
      {/* Subtle spotlight gradient — no overflow clip */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(600px circle at ${spotPos.x}px ${spotPos.y}px, rgba(37,99,235,0.04), transparent 50%)`,
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
