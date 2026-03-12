"use client";

import { useEffect, useRef, useCallback } from "react";

/* ── Light-mode: connected particle network ── */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

/* ── Dark-mode: starfield ── */

interface Star {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  // twinkle
  twinkleSpeed: number;
  twinklePhase: number;
  // glow layers
  glowRadius: number;
  hue: number; // slight color tint: 200-240 range (blue-ish)
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animFrameRef = useRef<number>(0);

  // Light-mode state
  const particlesRef = useRef<Particle[]>([]);

  // Dark-mode state
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const lastModeRef = useRef<boolean | null>(null);

  const initParticles = useCallback((w: number, h: number) => {
    const count = Math.min(Math.floor((w * h) / 10000), 150);
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    particlesRef.current = particles;
  }, []);

  const initStars = useCallback((w: number, h: number) => {
    const count = Math.min(Math.floor((w * h) / 3000), 300);
    const stars: Star[] = [];
    for (let i = 0; i < count; i++) {
      const isBright = Math.random() < 0.12;
      const r = isBright
        ? Math.random() * 1.8 + 1.0
        : Math.random() * 1.0 + 0.3;
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: r,
        baseOpacity: isBright ? Math.random() * 0.4 + 0.6 : Math.random() * 0.5 + 0.15,
        twinkleSpeed: Math.random() * 2 + 1,
        twinklePhase: Math.random() * Math.PI * 2,
        glowRadius: isBright ? r * 4 : r * 2,
        hue: 200 + Math.random() * 40,
      });
    }
    starsRef.current = stars;
    shootingStarsRef.current = [];
    ripplesRef.current = [];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      w = parent.offsetWidth;
      h = parent.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Re-init for current mode
      lastModeRef.current = null; // force re-init on next frame
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const handleClick = (e: MouseEvent) => {
      const dark = document.documentElement.classList.contains("dark");
      if (!dark) return;
      const rect = canvas.getBoundingClientRect();
      ripplesRef.current.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: 0,
        maxRadius: 80 + Math.random() * 40,
        opacity: 0.6,
      });
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", handleClick);

    let time = 0;

    const animate = () => {
      const dark = document.documentElement.classList.contains("dark");
      time += 0.016; // ~60fps

      // Re-init if mode changed
      if (lastModeRef.current !== dark) {
        if (dark) {
          initStars(w, h);
        } else {
          initParticles(w, h);
        }
        lastModeRef.current = dark;
      }

      ctx.clearRect(0, 0, w, h);

      if (dark) {
        drawStarfield(ctx, w, h, time);
      } else {
        drawParticles(ctx, w, h);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    /* ── Light-mode drawing ── */
    const drawParticles = (c: CanvasRenderingContext2D, W: number, H: number) => {
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          p.vx -= (dx / dist) * force * 0.02;
          p.vy -= (dy / dist) * force * 0.02;
        }
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        c.beginPath();
        c.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        c.fillStyle = `rgba(37, 99, 235, ${p.opacity})`;
        c.fill();
      }

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            c.beginPath();
            c.moveTo(particles[i].x, particles[i].y);
            c.lineTo(particles[j].x, particles[j].y);
            c.strokeStyle = `rgba(37, 99, 235, ${((100 - dist) / 100) * 0.15})`;
            c.lineWidth = 0.5;
            c.stroke();
          }
        }
      }

      // Mouse connections
      const mouse2 = mouseRef.current;
      for (const p of particles) {
        const dx = mouse2.x - p.x;
        const dy = mouse2.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(mouse2.x, mouse2.y);
          c.strokeStyle = `rgba(37, 99, 235, ${((150 - dist) / 150) * 0.25})`;
          c.lineWidth = 0.8;
          c.stroke();
        }
      }
    };

    /* ── Dark-mode drawing ── */
    const drawStarfield = (c: CanvasRenderingContext2D, W: number, H: number, t: number) => {
      const stars = starsRef.current;
      const mouse = mouseRef.current;
      const shootingStars = shootingStarsRef.current;
      const ripples = ripplesRef.current;

      // ── Stars with twinkle ──
      for (const s of stars) {
        const twinkle = Math.sin(t * s.twinkleSpeed + s.twinklePhase);
        // Opacity oscillates around baseOpacity
        const opacity = s.baseOpacity * (0.5 + 0.5 * twinkle);

        // Mouse proximity → stars glow brighter
        const dx = mouse.x - s.x;
        const dy = mouse.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseBoost = dist < 150 ? (150 - dist) / 150 : 0;
        const finalOpacity = Math.min(opacity + mouseBoost * 0.5, 1);

        // Outer glow
        if (s.glowRadius > 3 || mouseBoost > 0) {
          const glowR = s.glowRadius + mouseBoost * 8;
          const grad = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
          grad.addColorStop(0, `hsla(${s.hue}, 80%, 80%, ${finalOpacity * 0.35})`);
          grad.addColorStop(1, `hsla(${s.hue}, 80%, 80%, 0)`);
          c.beginPath();
          c.arc(s.x, s.y, glowR, 0, Math.PI * 2);
          c.fillStyle = grad;
          c.fill();
        }

        // Star core
        c.beginPath();
        c.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        c.fillStyle = `hsla(${s.hue}, 70%, 90%, ${finalOpacity})`;
        c.fill();

        // Cross flare on bright stars
        if (s.radius > 1.2 && finalOpacity > 0.5) {
          const flareLen = s.radius * 3 * finalOpacity;
          c.strokeStyle = `hsla(${s.hue}, 60%, 85%, ${finalOpacity * 0.3})`;
          c.lineWidth = 0.5;
          c.beginPath();
          c.moveTo(s.x - flareLen, s.y);
          c.lineTo(s.x + flareLen, s.y);
          c.moveTo(s.x, s.y - flareLen);
          c.lineTo(s.x, s.y + flareLen);
          c.stroke();
        }
      }

      // ── Shooting stars ──
      // Spawn occasionally
      if (Math.random() < 0.006) {
        const startX = Math.random() * W * 0.8;
        const speed = 4 + Math.random() * 4;
        const angle = (Math.PI / 6) + Math.random() * (Math.PI / 8);
        shootingStars.push({
          x: startX,
          y: -10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 60 + Math.random() * 40,
          length: 40 + Math.random() * 60,
        });
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life++;

        const progress = ss.life / ss.maxLife;
        const alpha = progress < 0.3
          ? progress / 0.3
          : 1 - (progress - 0.3) / 0.7;

        if (alpha <= 0 || ss.x > W + 50 || ss.y > H + 50) {
          shootingStars.splice(i, 1);
          continue;
        }

        // Tail
        const tailX = ss.x - (ss.vx / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length * alpha;
        const tailY = ss.y - (ss.vy / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length * alpha;

        const grad = c.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, `rgba(180, 210, 255, 0)`);
        grad.addColorStop(1, `rgba(220, 235, 255, ${alpha * 0.8})`);

        c.beginPath();
        c.moveTo(tailX, tailY);
        c.lineTo(ss.x, ss.y);
        c.strokeStyle = grad;
        c.lineWidth = 1.5;
        c.stroke();

        // Head glow
        const headGrad = c.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 4);
        headGrad.addColorStop(0, `rgba(240, 248, 255, ${alpha * 0.9})`);
        headGrad.addColorStop(1, `rgba(200, 220, 255, 0)`);
        c.beginPath();
        c.arc(ss.x, ss.y, 4, 0, Math.PI * 2);
        c.fillStyle = headGrad;
        c.fill();
      }

      // ── Click ripples ──
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 1.5;
        r.opacity -= 0.012;

        if (r.opacity <= 0 || r.radius > r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        // Expanding ring
        c.beginPath();
        c.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        c.strokeStyle = `rgba(180, 210, 255, ${r.opacity * 0.5})`;
        c.lineWidth = 1;
        c.stroke();

        // Brighten nearby stars
        for (const s of stars) {
          const dx = s.x - r.x;
          const dy = s.y - r.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (Math.abs(dist - r.radius) < 20) {
            const boost = (1 - Math.abs(dist - r.radius) / 20) * r.opacity;
            const glowR = s.radius * 3;
            const grad = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
            grad.addColorStop(0, `rgba(200, 220, 255, ${boost * 0.6})`);
            grad.addColorStop(1, `rgba(200, 220, 255, 0)`);
            c.beginPath();
            c.arc(s.x, s.y, glowR, 0, Math.PI * 2);
            c.fillStyle = grad;
            c.fill();
          }
        }
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("click", handleClick);
    };
  }, [initParticles, initStars]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-auto absolute inset-0 h-full w-full"
    />
  );
}
