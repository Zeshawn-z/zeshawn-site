"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
}

export default function GlowCard({ children, className = "" }: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    // Outer wrapper — no overflow hidden, glow extends beyond card boundary
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      {/* Outer glow — extends beyond card edges, not clipped */}
      <div
        className="pointer-events-none absolute -inset-4 z-0 opacity-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${pos.x + 16}px ${pos.y + 16}px, rgba(59,130,246,0.08), transparent 60%)`,
        }}
      />

      {/* Card surface — overflow-hidden clips content only */}
      <div
        className={`relative z-[1] overflow-hidden rounded-xl border border-border bg-card transition-colors duration-300 ${
          isHovered ? "border-accent/40" : ""
        } ${className}`}
      >
        {/* Inner glow — clipped within card's rounded boundary */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, rgba(59,130,246,0.10), transparent 50%)`,
          }}
        />
        <div className="relative z-[2]">{children}</div>
      </div>
    </div>
  );
}
