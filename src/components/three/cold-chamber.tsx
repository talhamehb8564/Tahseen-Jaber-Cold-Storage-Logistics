"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Grid, OrbitControls } from "@react-three/drei";

/**
 * COLD CHAMBER — an illustrative 3D model (Three.js / React Three Fiber).
 * ---------------------------------------------------------------------------
 * A stylised racked cold store, built entirely from primitives — no external
 * models or HDRIs are fetched, so nothing leaves the origin (CSP-safe).
 *
 *   RACKS      two aisle-facing rack rows plus a back wall, each with three
 *              shelf levels of sealed pallet loads and emissive azure strips.
 *   CORE       the chamber's "cold heart": a violet-glowing icosahedron in a
 *              wireframe shell with an orbiting scan ring, floating gently.
 *   SNOW DUST  drifting particles inside the volume, wrapping at the floor.
 *   GRID       an infinite indigo floor grid fading into fog.
 *
 * The camera auto-orbits slowly and can be dragged (OrbitControls, damped,
 * zoom-limited, never below the floor). Mounted only while near the viewport
 * by the section wrapper — see three-chamber-section.tsx.
 */

/* Brand lighting for the light theme: the chamber stays a dark "night
   viewport" (like a photograph), but its emissives are copper + navy now. */
const AZURE = "#d99a6c"; // copper-light emissive (rack strips, scan ring)
const VIOLET = "#b66a3c"; // copper glow (crystal core)
const HULL = "#121d48";
const HULL_LINE = "#263a7a";

function ShelfLoads({ level }: { level: number }) {
  return (
    <>
      {[-1.8, 0, 1.8].map((x) => (
        <mesh key={x} position={[x, level + 0.56, 0]}>
          <boxGeometry args={[1.55, 1.05, 1.85]} />
          <meshStandardMaterial color="#7fa6d4" roughness={0.55} metalness={0.08} />
        </mesh>
      ))}
    </>
  );
}

function Rack({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const levels = [0.85, 2.05, 3.25];
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* uprights */}
      {[-2.7, -0.9, 0.9, 2.7].map((x) =>
        [-1.05, 1.05].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 2.25, z]}>
            <boxGeometry args={[0.1, 4.5, 0.1]} />
            <meshStandardMaterial color={HULL_LINE} roughness={0.4} metalness={0.65} />
          </mesh>
        )),
      )}
      {/* shelf levels: deck, emissive strip, sealed loads */}
      {levels.map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[5.6, 0.09, 2.2]} />
            <meshStandardMaterial color={HULL} roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, y + 0.07, 1.12]}>
            <boxGeometry args={[5.6, 0.045, 0.045]} />
            <meshStandardMaterial
              color={AZURE}
              emissive={AZURE}
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </mesh>
          <ShelfLoads level={y} />
        </group>
      ))}
    </group>
  );
}

function CrystalCore() {
  const ring = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ring.current) {
      ring.current.rotation.z += delta * 0.5;
      ring.current.rotation.x = Math.PI / 2.4 + Math.sin(state.clock.elapsedTime * 0.4) * 0.3;
    }
    if (inner.current) {
      inner.current.rotation.y += delta * 0.45;
      inner.current.rotation.x += delta * 0.18;
    }
  });

  return (
    <group position={[0, 1.9, 0]}>
      <Float speed={2.2} rotationIntensity={0.35} floatIntensity={0.85}>
        <mesh ref={inner}>
          <icosahedronGeometry args={[1.05, 0]} />
          <meshStandardMaterial
            color="#1b2a63"
            emissive={VIOLET}
            emissiveIntensity={1.7}
            roughness={0.25}
            metalness={0.35}
          />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.45, 0]} />
          <meshBasicMaterial color={AZURE} wireframe transparent opacity={0.22} />
        </mesh>
        <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[2.05, 0.018, 8, 96]} />
          <meshStandardMaterial
            color={AZURE}
            emissive={AZURE}
            emissiveIntensity={1.4}
            toneMapped={false}
          />
        </mesh>
        <pointLight color={VIOLET} intensity={26} distance={13} decay={2} />
      </Float>
    </group>
  );
}

function SnowDust({ count = 320 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      array[i * 3] = (Math.random() - 0.5) * 22;
      array[i * 3 + 1] = Math.random() * 7.5;
      array[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return array;
  }, [count]);

  useFrame((state, delta) => {
    const points = ref.current;
    if (!points) return;
    const attribute = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;
    for (let i = 0; i < count; i++) {
      array[i * 3 + 1]! -= delta * (0.25 + (i % 5) * 0.08);
      array[i * 3]! += Math.sin(state.clock.elapsedTime * 0.5 + i) * delta * 0.06;
      if (array[i * 3 + 1]! < 0.05) array[i * 3 + 1]! = 7.4;
    }
    attribute.needsUpdate = true;
    points.rotation.y += delta * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color="#dceeff"
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Ceiling() {
  return (
    <group position={[0, 5.4, 0]}>
      {[-3.5, 0, 3.5].map((z) => (
        <mesh key={z} position={[0, 0, z]}>
          <boxGeometry args={[13, 0.06, 0.28]} />
          <meshStandardMaterial
            color="#e3b48c"
            emissive={AZURE}
            emissiveIntensity={1.1}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function ColdChamber() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 3.4, 11.5], fov: 42 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#060a20"]} />
      <fog attach="fog" args={["#060a20", 9, 30]} />

      <ambientLight intensity={0.3} color="#b9c4d8" />
      <directionalLight position={[6, 9, 5]} intensity={0.75} color="#e8dccb" />
      <directionalLight position={[-7, 6, -4]} intensity={0.4} color="#8a5a3c" />

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[46, 46]} />
        <meshStandardMaterial color="#0a0f2e" roughness={0.38} metalness={0.62} />
      </mesh>
      <Grid
        position={[0, 0.012, 0]}
        args={[46, 46]}
        cellSize={1.15}
        cellThickness={0.55}
        cellColor="#1b2a63"
        sectionSize={5.75}
        sectionThickness={1.1}
        sectionColor={HULL_LINE}
        fadeDistance={30}
        fadeStrength={1.5}
        infiniteGrid
      />

      <Rack position={[-4.1, 0, -1.6]} rotation={Math.PI / 2} />
      <Rack position={[4.1, 0, -1.6]} rotation={Math.PI / 2} />
      <Rack position={[0, 0, -6.4]} />

      <CrystalCore />
      <SnowDust />
      <Ceiling />

      <OrbitControls
        makeDefault
        autoRotate
        autoRotateSpeed={0.65}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={6.5}
        maxDistance={17}
        minPolarAngle={0.7}
        maxPolarAngle={Math.PI * 0.47}
        target={[0, 1.7, 0]}
      />
    </Canvas>
  );
}
