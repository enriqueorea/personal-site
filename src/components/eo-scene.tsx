"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { EOParticles } from "./eo-particles";

export function EOScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
      }}
    >
      <Suspense fallback={null}>
        <EOParticles />
      </Suspense>
    </Canvas>
  );
}
