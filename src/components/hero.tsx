"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import dynamic from "next/dynamic";
import { OrbitButton } from "./orbit-button";

gsap.registerPlugin(useGSAP);

const HeroScene = dynamic(
  () => import("./hero-scene").then((m) => ({ default: m.HeroScene })),
  { ssr: false }
);

const NAV_LINKS = ["trabajo", "historia", "contacto"] as const;

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [inverted, setInverted] = useState(false);

  const toggleInverted = () => {
    setInverted((v) => !v);
    if (sceneRef.current) {
      gsap.fromTo(
        sceneRef.current,
        { opacity: 0.4 },
        { opacity: 1, duration: 0.5, ease: "power2.out" }
      );
    }
  };

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-anim='scene']", {
        opacity: 0,
        duration: 1.8,
        ease: "power2.inOut",
      })
        .from(
          "[data-anim='nav-logo']",
          { opacity: 0, y: -12, duration: 0.6 },
          0.3
        )
        .from(
          "[data-anim='nav-link']",
          { opacity: 0, y: -8, duration: 0.5, stagger: 0.07 },
          0.4
        )
        .from(
          "[data-anim='initials']",
          { opacity: 0, duration: 0.7 },
          0.5
        )
        .from(
          "[data-anim='headline-line']",
          {
            yPercent: 120,
            duration: 1,
            stagger: 0.12,
            ease: "power4.out",
          },
          0.65
        )
        .from(
          "[data-anim='location']",
          { opacity: 0, y: 12, duration: 0.6 },
          1.2
        )
        .from(
          "[data-anim='cta']",
          { opacity: 0, y: 10, duration: 0.5 },
          1.35
        )
        .from(
          "[data-anim='tenet']",
          { opacity: 0, duration: 1.2 },
          1.6
        )
        .from(
          "[data-anim='easter']",
          { opacity: 0, duration: 2 },
          1.5
        );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative h-svh overflow-hidden bg-background"
    >
      <div
        ref={sceneRef}
        data-anim="scene"
        className="absolute inset-0 z-0"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.08) 15%, rgba(0,0,0,0.4) 35%, rgba(0,0,0,0.75) 55%, black 75%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.08) 15%, rgba(0,0,0,0.4) 35%, rgba(0,0,0,0.75) 55%, black 75%)",
        }}
      >
        <HeroScene inverted={inverted} />
      </div>

      <nav className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-8 py-8 sm:px-12 lg:px-16 xl:px-20">
        <span
          data-anim="nav-logo"
          className="font-serif text-2xl tracking-wide text-foreground"
        >
          EO
        </span>
        <div className="flex gap-8 sm:gap-10">
          {NAV_LINKS.map((item) => (
            <a
              key={item}
              data-anim="nav-link"
              href={`#${item}`}
              className="font-mono text-[11px] uppercase tracking-[3px] text-text-faint transition-colors duration-300 hover:text-brand"
            >
              {item}
            </a>
          ))}
        </div>
      </nav>

      <div className="pointer-events-none relative z-20 flex h-full flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 2xl:px-32">
        <div className="pointer-events-auto max-w-[620px]">
          <span
            data-anim="initials"
            className="mb-8 block font-mono text-[10px] uppercase tracking-[6px] text-text-faint"
          >
            Enrique Orea
          </span>

          <h1
            className="mb-10 font-serif font-normal leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(44px, 5.8vw, 84px)" }}
          >
            <span className="block overflow-hidden">
              <span data-anim="headline-line" className="block">
                Desarrollo software.
              </span>
            </span>
            <span className="block overflow-hidden">
              <span
                data-anim="headline-line"
                className="block"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                A veces lidero equipos.
              </span>
            </span>
            <span className="block overflow-hidden">
              <span data-anim="headline-line" className="block">
                Siempre estoy{" "}
                <em className="text-brand not-italic">inventando</em> algo.
              </span>
            </span>
          </h1>

          <p
            data-anim="location"
            className="mb-12 font-sans text-[15px] leading-relaxed text-text-muted"
          >
            Desde Xalapa, México.
          </p>

          <div data-anim="cta">
            <OrbitButton href="#trabajo">Ver proyectos</OrbitButton>
          </div>
        </div>
      </div>

      <button
        data-anim="tenet"
        onClick={toggleInverted}
        className="absolute bottom-6 left-7 z-30 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[3px] text-text-faint transition-colors duration-300 hover:text-brand"
      >
        <span
          className="inline-block transition-transform duration-500"
          style={{ transform: inverted ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ↺
        </span>
        <span>{inverted ? "restaurar" : "invertir"}</span>
      </button>

      <p
        data-anim="easter"
        className="absolute bottom-6 right-7 z-30 max-w-[200px] select-none text-right font-mono text-[9px] italic leading-relaxed"
        style={{ color: "rgba(255,255,255,0.06)" }}
      >
        Si no sabes a dónde vas, cualquier camino te lleva.
      </p>
    </section>
  );
}
