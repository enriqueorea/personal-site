"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const CORE_COUNT = 80;
const AMBIENT_COUNT = 180;
const TOTAL = CORE_COUNT + AMBIENT_COUNT;
const RETURN_SPEED = 0.022;
const IDLE_SPEED = 0.25;

const GLOW_COUNT = 22;
const INTRO_DURATION = 2.6;

const VELOCITY_THRESHOLD = 0.06;
const ATTRACT_STRENGTH = 0.35;
const ORBITAL_STRENGTH = 0.18;
const REPEL_STRENGTH = 0.55;
const GRAVITY_RANGE_CORE = 2.8;
const GRAVITY_RANGE_AMBIENT = 4.0;

const SING_COLLAPSE = 0.8;
const SING_HOLD = 0.3;
const SING_EXPLODE = 1.4;
const SING_TOTAL = SING_COLLAPSE + SING_HOLD + SING_EXPLODE;

const TEAL = { r: 0.392, g: 0.875, b: 0.875 };

interface SingularityState {
  active: boolean;
  x: number;
  y: number;
  startTime: number;
}

function SoftGlows() {
  const ref = useRef<THREE.Points>(null);

  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(GLOW_COUNT * 3);
    const ph = new Float32Array(GLOW_COUNT);

    for (let i = 0; i < GLOW_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
      ph[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, phases: ph };
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        },
        vertexShader: `
          attribute float phase;
          varying float vFlicker;
          uniform float uTime;
          uniform float uPixelRatio;
          void main() {
            float speed = 0.15 + phase * 0.1;
            float raw = sin(uTime * speed + phase * 6.2831);
            vFlicker = raw * 0.5 + 0.5;
            vFlicker *= vFlicker;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (4.0 + vFlicker * 8.0) * uPixelRatio * (1.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vFlicker;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = exp(-d * d * 20.0) * vFlicker * 0.35;
            gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame((state) => {
    if (!ref.current) return;
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points ref={ref} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-phase" args={[phases, 1]} />
      </bufferGeometry>
    </points>
  );
}

export interface EOParticlesProps {
  inverted?: boolean;
}

export function EOParticles({ inverted = false }: EOParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const mouseTarget = useRef(new THREE.Vector2());
  const mouseCurrent = useRef(new THREE.Vector2());
  const mousePrev = useRef(new THREE.Vector2());
  const mouseVel = useRef(0);
  const singularity = useRef<SingularityState>({
    active: false,
    x: 0,
    y: 0,
    startTime: 0,
  });
  const { viewport, gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    const handler = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      singularity.current = {
        active: true,
        x: (ndcX * viewport.width) / 2,
        y: (ndcY * viewport.height) / 2,
        startTime: -1,
      };
    };
    el.addEventListener("pointerdown", handler);
    return () => el.removeEventListener("pointerdown", handler);
  }, [gl, viewport]);

  const { positions, basePositions, opacities, depthFactors, invertGroups } =
    useMemo(() => {
      const pos = new Float32Array(TOTAL * 3);
      const base = new Float32Array(TOTAL * 3);
      const opa = new Float32Array(TOTAL);
      const depth = new Float32Array(TOTAL);
      const inv = new Float32Array(TOTAL);

      for (let i = 0; i < CORE_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 1.0 + Math.random() * 1.2;

        base[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        base[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        base[i * 3 + 2] = r * Math.cos(phi) * 0.6;

        pos[i * 3] = 0;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = 0;

        opa[i] = 0.5 + Math.random() * 0.5;
        depth[i] = 0.7 + ((base[i * 3 + 2] + 1) / 2) * 0.8;
        inv[i] = Math.random() > 0.5 ? 1 : 0;
      }

      for (let i = CORE_COUNT; i < TOTAL; i++) {
        const spread = 10;
        base[i * 3] = (Math.random() - 0.5) * spread * 1.8;
        base[i * 3 + 1] = (Math.random() - 0.5) * spread;
        base[i * 3 + 2] = (Math.random() - 0.5) * 7 - 1;

        pos[i * 3] = 0;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = 0;

        opa[i] = 0.12 + Math.random() * 0.38;
        const z = base[i * 3 + 2];
        depth[i] = 0.3 + ((z + 4.5) / 7.0) * 1.3;
        inv[i] = Math.random() > 0.5 ? 1 : 0;
      }

      return {
        positions: pos,
        basePositions: base,
        opacities: opa,
        depthFactors: depth,
        invertGroups: inv,
      };
    }, []);

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color("#64dfdf") },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uIntro: { value: 0 },
        },
        vertexShader: `
          attribute float opacity;
          varying float vOpacity;
          uniform float uPixelRatio;
          uniform float uIntro;
          void main() {
            vOpacity = opacity * uIntro;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (28.0 + opacity * 40.0) * uPixelRatio * (1.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vOpacity;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = smoothstep(0.5, 0.05, d) * vOpacity;
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

    const time = state.clock.elapsedTime;

    const introRaw = Math.min(1, time / INTRO_DURATION);
    const intro = 1 - Math.pow(1 - introRaw, 3);
    shaderMaterial.uniforms.uIntro.value = intro;

    const pointer = state.pointer;
    mouseTarget.current.set(
      (pointer.x * viewport.width) / 2,
      (pointer.y * viewport.height) / 2
    );
    mousePrev.current.copy(mouseCurrent.current);
    mouseCurrent.current.lerp(mouseTarget.current, 0.05);
    const rawVel = mouseCurrent.current.distanceTo(mousePrev.current);
    mouseVel.current = THREE.MathUtils.lerp(mouseVel.current, rawVel, 0.1);

    const sing = singularity.current;
    if (sing.active && sing.startTime < 0) sing.startTime = time;
    const singT = sing.active ? time - sing.startTime : -1;
    if (singT > SING_TOTAL) sing.active = false;

    if (
      sing.active &&
      singT >= SING_COLLAPSE &&
      singT < SING_COLLAPSE + SING_HOLD
    ) {
      const pulse = Math.sin(
        ((singT - SING_COLLAPSE) / SING_HOLD) * Math.PI
      );
      shaderMaterial.uniforms.uColor.value.setRGB(
        THREE.MathUtils.lerp(TEAL.r, 1.0, pulse * 0.7),
        THREE.MathUtils.lerp(TEAL.g, 1.0, pulse * 0.4),
        THREE.MathUtils.lerp(TEAL.b, 1.0, pulse * 0.4)
      );
    } else {
      shaderMaterial.uniforms.uColor.value.setRGB(TEAL.r, TEAL.g, TEAL.b);
    }

    const posAttr = pointsRef.current.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    const baseLerp = RETURN_SPEED + delta + (1 - introRaw) * 0.08;

    const vel = mouseVel.current;
    const attractF = Math.max(0, 1 - vel / VELOCITY_THRESHOLD);
    const repelF = Math.min(1, vel / VELOCITY_THRESHOLD);

    const windX = Math.sin(time * 0.04) * 0.12;
    const windY = Math.cos(time * 0.025) * 0.06;

    for (let i = 0; i < TOTAL; i++) {
      const i3 = i * 3;
      const isCore = i < CORE_COUNT;
      const dm = depthFactors[i];

      const timeDir = inverted && invertGroups[i] === 1 ? -1 : 1;
      const et = time * timeDir;

      const spd = (isCore ? IDLE_SPEED : IDLE_SPEED * 0.6) * dm;
      const drift = (isCore ? 0.18 : 0.35) * dm;

      const targetX =
        basePositions[i3] * intro +
        Math.sin(et * spd + i * 0.5) * drift * intro +
        windX * dm * intro * timeDir;
      const targetY =
        basePositions[i3 + 1] * intro +
        Math.cos(et * spd + i * 0.3) * drift * intro +
        windY * dm * intro * timeDir;
      const targetZ =
        basePositions[i3 + 2] * intro +
        Math.sin(et * spd * 0.7 + i * 0.7) * drift * 0.4 * intro;

      let pushX = 0;
      let pushY = 0;

      if (intro > 0.3) {
        const dx = mouseCurrent.current.x - posArray[i3];
        const dy = mouseCurrent.current.y - posArray[i3 + 1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = isCore ? GRAVITY_RANGE_CORE : GRAVITY_RANGE_AMBIENT;

        if (dist < maxDist && dist > 0.01) {
          const strength =
            (1 - dist / maxDist) * (isCore ? 1.0 : 0.4) * intro;
          const ndx = dx / dist;
          const ndy = dy / dist;

          pushX += ndx * ATTRACT_STRENGTH * strength * attractF;
          pushY += ndy * ATTRACT_STRENGTH * strength * attractF;
          pushX += -ndy * ORBITAL_STRENGTH * strength * attractF;
          pushY += ndx * ORBITAL_STRENGTH * strength * attractF;

          pushX -= ndx * REPEL_STRENGTH * strength * repelF;
          pushY -= ndy * REPEL_STRENGTH * strength * repelF;
        }
      }

      if (sing.active && singT >= 0) {
        const sdx = sing.x - posArray[i3];
        const sdy = sing.y - posArray[i3 + 1];
        const sdist = Math.sqrt(sdx * sdx + sdy * sdy);

        if (sdist > 0.01) {
          const sndx = sdx / sdist;
          const sndy = sdy / sdist;

          if (singT < SING_COLLAPSE) {
            const t = singT / SING_COLLAPSE;
            const force = (t * 2.5) / (sdist + 0.15);
            pushX += sndx * force;
            pushY += sndy * force;
            pushX += -sndy * force * 0.35;
            pushY += sndx * force * 0.35;
          } else if (singT < SING_COLLAPSE + SING_HOLD) {
            const force = 4.0 / (sdist + 0.05);
            pushX += sndx * force * 0.4;
            pushY += sndy * force * 0.4;
          } else {
            const expT =
              (singT - SING_COLLAPSE - SING_HOLD) / SING_EXPLODE;
            const force =
              ((1 - expT) * (1 - expT) * 3.0) / (sdist + 0.3);
            pushX -= sndx * force;
            pushY -= sndy * force;
          }
        }
      }

      const activeLerp = sing.active ? Math.max(baseLerp, 0.12) : baseLerp;
      posArray[i3] += (targetX + pushX - posArray[i3]) * activeLerp;
      posArray[i3 + 1] += (targetY + pushY - posArray[i3 + 1]) * activeLerp;
      posArray[i3 + 2] += (targetZ - posArray[i3 + 2]) * baseLerp;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <group>
      <points ref={pointsRef} material={shaderMaterial}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-opacity"
            args={[opacities, 1]}
          />
        </bufferGeometry>
      </points>

      <SoftGlows />
    </group>
  );
}
