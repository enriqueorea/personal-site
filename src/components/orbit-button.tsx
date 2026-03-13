"use client";

import { useRef, useEffect, type ReactNode } from "react";

const DOT_COUNT = 12;
const BASE_SPEED = 0.00025;
const HOVER_SPEED_MUL = 3;
const DOT_RADIUS = 2.2;
const DOT_COLOR = "100, 223, 223";
const PADDING = 8;
const TRAIL_LENGTH = 4;
const DISPERSE_DURATION = 600;

interface Dot {
  t: number;
  speed: number;
  baseAlpha: number;
  trail: Array<{ x: number; y: number }>;
  vx: number;
  vy: number;
  dx: number;
  dy: number;
}

function pointOnRect(
  t: number,
  w: number,
  h: number
): [number, number] {
  const perimeter = 2 * (w + h);
  const d = (((t % 1) + 1) % 1) * perimeter;

  if (d < w) return [d, 0];
  if (d < w + h) return [w, d - w];
  if (d < 2 * w + h) return [w - (d - w - h), h];
  return [0, h - (d - 2 * w - h)];
}

export interface OrbitButtonProps {
  href: string;
  children: ReactNode;
}

export function OrbitButton({ href, children }: OrbitButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const hoveredRef = useRef(false);
  const dispersingRef = useRef(false);
  const disperseStartRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const dots: Dot[] = [];
    for (let i = 0; i < DOT_COUNT; i++) {
      dots.push({
        t: i / DOT_COUNT,
        speed: BASE_SPEED * (0.85 + Math.random() * 0.3),
        baseAlpha: 0.3 + Math.random() * 0.15,
        trail: [],
        vx: 0,
        vy: 0,
        dx: 0,
        dy: 0,
      });
    }
    dotsRef.current = dots;

    let lastTime = 0;

    const loop = (timestamp: number) => {
      const dt = lastTime ? timestamp - lastTime : 16;
      lastTime = timestamp;

      const canvas = canvasRef.current;
      const button = buttonRef.current;
      if (!canvas || !button) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = button.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      const cw = rect.width + PADDING * 2;
      const ch = rect.height + PADDING * 2;

      const targetW = Math.round(cw * dpr);
      const targetH = Math.round(ch * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        canvas.style.width = `${cw}px`;
        canvas.style.height = `${ch}px`;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, PADDING * dpr, PADDING * dpr);

      const bw = rect.width;
      const bh = rect.height;
      const dotsList = dotsRef.current;

      if (dispersingRef.current) {
        const elapsed = timestamp - disperseStartRef.current;
        const progress = Math.min(1, elapsed / DISPERSE_DURATION);

        for (const dot of dotsList) {
          dot.dx += dot.vx * (dt / 16);
          dot.dy += dot.vy * (dt / 16);
          dot.vx *= 0.95;
          dot.vy *= 0.95;

          const fadeAlpha = (1 - progress) * dot.baseAlpha * 1.5;
          if (fadeAlpha > 0.01) {
            const grad = ctx.createRadialGradient(
              dot.dx, dot.dy, 0,
              dot.dx, dot.dy, DOT_RADIUS * 2.5
            );
            grad.addColorStop(0, `rgba(${DOT_COLOR}, ${fadeAlpha})`);
            grad.addColorStop(1, `rgba(${DOT_COLOR}, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(
              dot.dx - DOT_RADIUS * 2.5,
              dot.dy - DOT_RADIUS * 2.5,
              DOT_RADIUS * 5,
              DOT_RADIUS * 5
            );
          }
        }

        if (progress >= 1) {
          dispersingRef.current = false;
          for (let i = 0; i < dotsList.length; i++) {
            dotsList[i].t = i / DOT_COUNT;
            dotsList[i].vx = 0;
            dotsList[i].vy = 0;
            dotsList[i].trail.length = 0;
          }
        }
      } else {
        const speedMul = hoveredRef.current ? HOVER_SPEED_MUL : 1;

        for (const dot of dotsList) {
          dot.t = (dot.t + dot.speed * speedMul * dt) % 1;
          const [x, y] = pointOnRect(dot.t, bw, bh);

          if (hoveredRef.current) {
            dot.trail.push({ x, y });
            if (dot.trail.length > TRAIL_LENGTH) dot.trail.shift();
          } else if (dot.trail.length > 0) {
            dot.trail.shift();
          }

          const alphaMul = hoveredRef.current ? 2.2 : 1.0;
          const dotAlpha = Math.min(0.85, dot.baseAlpha * alphaMul);

          for (let ti = 0; ti < dot.trail.length; ti++) {
            const ta =
              dotAlpha * ((ti + 1) / (dot.trail.length + 1)) * 0.35;
            const tp = dot.trail[ti];
            const tGrad = ctx.createRadialGradient(
              tp.x, tp.y, 0,
              tp.x, tp.y, DOT_RADIUS * 2
            );
            tGrad.addColorStop(0, `rgba(${DOT_COLOR}, ${ta})`);
            tGrad.addColorStop(1, `rgba(${DOT_COLOR}, 0)`);
            ctx.fillStyle = tGrad;
            ctx.fillRect(
              tp.x - DOT_RADIUS * 2,
              tp.y - DOT_RADIUS * 2,
              DOT_RADIUS * 4,
              DOT_RADIUS * 4
            );
          }

          const grad = ctx.createRadialGradient(
            x, y, 0,
            x, y, DOT_RADIUS * 2.5
          );
          grad.addColorStop(0, `rgba(${DOT_COLOR}, ${dotAlpha})`);
          grad.addColorStop(1, `rgba(${DOT_COLOR}, 0)`);
          ctx.fillStyle = grad;
          ctx.fillRect(
            x - DOT_RADIUS * 2.5,
            y - DOT_RADIUS * 2.5,
            DOT_RADIUS * 5,
            DOT_RADIUS * 5
          );

          dot.dx = x;
          dot.dy = y;
        }
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    for (const dot of dotsRef.current) {
      const ddx = dot.dx - cx;
      const ddy = dot.dy - cy;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
      dot.vx = (ddx / dist) * (3 + Math.random() * 2);
      dot.vy = (ddy / dist) * (3 + Math.random() * 2);
    }

    dispersingRef.current = true;
    disperseStartRef.current = performance.now();

    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }, 250);
  };

  return (
    <span className="relative inline-flex">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute"
        style={{ top: -PADDING, left: -PADDING }}
      />
      <a
        ref={buttonRef}
        href={href}
        onClick={handleClick}
        onMouseEnter={() => { hoveredRef.current = true; }}
        onMouseLeave={() => { hoveredRef.current = false; }}
        className="group relative inline-flex items-center gap-4 px-8 py-5 font-mono text-[13px] uppercase tracking-[2.5px] text-text-faint transition-colors duration-300 hover:text-brand sm:px-7 sm:py-4 sm:text-[11px]"
      >
        {children}
        <span className="text-brand transition-transform duration-300 group-hover:translate-x-1.5">
          →
        </span>
      </a>
    </span>
  );
}
