"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const CORE_COUNT = 60;
const AMBIENT_COUNT = 160;
const TOTAL = CORE_COUNT + AMBIENT_COUNT;
const MOUSE_INFLUENCE = 0.6;
const RETURN_SPEED = 0.015;
const IDLE_SPEED = 0.12;

export function EOParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const mouseTarget = useRef(new THREE.Vector2(0, 0));
  const mouseCurrent = useRef(new THREE.Vector2(0, 0));
  const { viewport } = useThree();

  const { positions, basePositions, opacities } = useMemo(() => {
    const pos = new Float32Array(TOTAL * 3);
    const base = new Float32Array(TOTAL * 3);
    const opa = new Float32Array(TOTAL);

    for (let i = 0; i < CORE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.2 + Math.random() * 1.0;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi) * 0.4;

      base[i * 3] = pos[i * 3];
      base[i * 3 + 1] = pos[i * 3 + 1];
      base[i * 3 + 2] = pos[i * 3 + 2];

      opa[i] = 0.3 + Math.random() * 0.5;
    }

    for (let i = CORE_COUNT; i < TOTAL; i++) {
      const spread = 8;
      pos[i * 3] = (Math.random() - 0.5) * spread * 1.8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3 - 1;

      base[i * 3] = pos[i * 3];
      base[i * 3 + 1] = pos[i * 3 + 1];
      base[i * 3 + 2] = pos[i * 3 + 2];

      opa[i] = 0.08 + Math.random() * 0.25;
    }

    return { positions: pos, basePositions: base, opacities: opa };
  }, []);

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color("#64dfdf") },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        },
        vertexShader: `
          attribute float opacity;
          varying float vOpacity;
          uniform float uPixelRatio;
          void main() {
            vOpacity = opacity;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (30.0 + opacity * 40.0) * uPixelRatio * (1.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vOpacity;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = smoothstep(0.5, 0.0, d) * vOpacity;
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const pointer = state.pointer;
    mouseTarget.current.set(
      (pointer.x * viewport.width) / 2,
      (pointer.y * viewport.height) / 2
    );
    mouseCurrent.current.lerp(mouseTarget.current, 0.05);

    const time = state.clock.elapsedTime;
    const posAttr = pointsRef.current.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < TOTAL; i++) {
      const i3 = i * 3;
      const isCore = i < CORE_COUNT;
      const speed = isCore ? IDLE_SPEED : IDLE_SPEED * 0.5;
      const drift = isCore ? 0.08 : 0.15;

      const idleX = basePositions[i3] + Math.sin(time * speed + i * 0.5) * drift;
      const idleY =
        basePositions[i3 + 1] + Math.cos(time * speed + i * 0.3) * drift;
      const idleZ =
        basePositions[i3 + 2] +
        Math.sin(time * speed * 0.7 + i * 0.7) * drift * 0.5;

      let pushX = 0;
      let pushY = 0;
      const dx = mouseCurrent.current.x - posArray[i3];
      const dy = mouseCurrent.current.y - posArray[i3 + 1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = isCore ? 2.5 : 3.5;

      if (dist < maxDist) {
        const force = (1 - dist / maxDist) * (isCore ? MOUSE_INFLUENCE : 0.15);
        pushX = -dx * force;
        pushY = -dy * force;
      }

      const returnSpd = RETURN_SPEED + delta;
      posArray[i3] += (idleX + pushX - posArray[i3]) * returnSpd;
      posArray[i3 + 1] += (idleY + pushY - posArray[i3 + 1]) * returnSpd;
      posArray[i3 + 2] += (idleZ - posArray[i3 + 2]) * returnSpd;
    }

    posAttr.needsUpdate = true;

    if (ringsRef.current) {
      ringsRef.current.rotation.y += delta * 0.04;
      ringsRef.current.rotation.x = Math.sin(time * 0.2) * 0.03;
    }
  });

  return (
    <group>
      <points ref={pointsRef} material={shaderMaterial}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-opacity" args={[opacities, 1]} />
        </bufferGeometry>
      </points>

      <group ref={ringsRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.18, 2.19, 256]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.018}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[1.2, 0.4, 0]}>
          <ringGeometry args={[1.72, 1.73, 256]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.014}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[0.5, -0.3, 0.8]}>
          <ringGeometry args={[1.32, 1.328, 256]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.01}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
