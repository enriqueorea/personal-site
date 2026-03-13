"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { EOParticles } from "./eo-particles";

export interface HeroSceneProps {
  inverted?: boolean;
}

export function HeroScene({ inverted = false }: HeroSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <EOParticles inverted={inverted} />
      </Suspense>
    </Canvas>
  );
}
