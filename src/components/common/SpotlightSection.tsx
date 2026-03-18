"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface MousePos {
  x: number;
  y: number;
  active: boolean;
}

const SpotlightContext = createContext<MousePos>({
  x: 0,
  y: 0,
  active: false,
});

export function useSpotlightMouse() {
  return useContext(SpotlightContext);
}

interface SpotlightSectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Monitors mouse at the document level so the spotlight effect
 * is never clipped by the section's horizontal bounds.
 *
 * `active` is true whenever the mouse is within the section's
 * vertical range (plus a generous margin), regardless of
 * horizontal position.
 */
export default function SpotlightSection({
  children,
  className = "",
}: SpotlightSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState<MousePos>({ x: 0, y: 0, active: false });

  useEffect(() => {
    // Vertical margin — keeps active a bit beyond the section top/bottom
    const MARGIN_Y = 200;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();

      // Only check vertical proximity — horizontal is unlimited
      const inVerticalRange =
        e.clientY >= rect.top - MARGIN_Y &&
        e.clientY <= rect.bottom + MARGIN_Y;

      setMouse({ x: e.clientX, y: e.clientY, active: inVerticalRange });
    };

    const handleMouseLeave = () => {
      // Mouse left the entire document / browser window
      setMouse((prev) => ({ ...prev, active: false }));
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <SpotlightContext.Provider value={mouse}>
      <div ref={ref} className={`relative ${className}`}>
        {children}
      </div>
    </SpotlightContext.Provider>
  );
}
