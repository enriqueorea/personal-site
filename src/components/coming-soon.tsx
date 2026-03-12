"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import dynamic from "next/dynamic";

const EOScene = dynamic(
  () => import("./eo-scene").then((m) => ({ default: m.EOScene })),
  { ssr: false }
);

gsap.registerPlugin(useGSAP);

export function ComingSoon() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-anim='scene']", {
        opacity: 0,
        duration: 2,
      })
        .from(
          "[data-anim='monogram']",
          { opacity: 0, y: -20, duration: 1.2 },
          "-=1.2"
        )
        .from(
          "[data-anim='headline']",
          { opacity: 0, y: 30, duration: 1 },
          "-=0.7"
        )
        .from(
          "[data-anim='sub']",
          { opacity: 0, y: 20, duration: 0.8 },
          "-=0.5"
        )
        .from(
          "[data-anim='links'] a",
          { opacity: 0, y: 10, duration: 0.5, stagger: 0.12 },
          "-=0.3"
        )
        .from("[data-anim='easter']", { opacity: 0, duration: 2 }, "-=0.3");
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="relative flex h-svh flex-col items-center justify-center overflow-hidden bg-background"
    >
      {/* 3D particles — fixed full-bleed background */}
      <div data-anim="scene" className="fixed inset-0 z-0">
        <EOScene />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        {/* EO monogram — DOM, above headline */}
        <span
          data-anim="monogram"
          className="font-serif text-6xl tracking-[0.15em] text-foreground/6 select-none sm:text-7xl"
        >
          EO
        </span>

        <div className="flex flex-col items-center gap-3 text-center">
          <h1
            data-anim="headline"
            className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Algo se está <em className="text-brand">cocinando</em>
          </h1>
          <p
            data-anim="sub"
            className="max-w-sm font-sans text-base leading-relaxed text-muted-foreground"
          >
            Este sitio está en construcción. Mientras tanto, el código sigue
            avanzando.
          </p>
        </div>

        <div
          data-anim="links"
          className="flex gap-6 font-mono text-[11px] uppercase tracking-[3px] text-text-faint"
        >
          <a
            href="https://github.com/enriqueorea"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-brand"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/enriqueorea"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-brand"
          >
            LinkedIn
          </a>
        </div>
      </div>

      {/* Easter egg */}
      <p
        data-anim="easter"
        className="absolute bottom-6 right-6 max-w-[200px] text-right font-mono text-[9px] italic leading-relaxed text-foreground/8 select-none"
      >
        Si no sabes a dónde vas, cualquier camino te lleva.
      </p>
    </div>
  );
}
