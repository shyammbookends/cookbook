"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment } from "@react-three/drei";
import type { Mesh } from "three";

export interface BrandBlobProps {
  accent: string;
  accentSoft: string;
  /** Rotation speed multiplier — "loud"/"feral" brands spin faster. */
  speed?: number;
  /** Surface turbulence, 0-1. */
  distort?: number;
  geometry?: "icosahedron" | "sphere" | "torus" | "box";
  roughness?: number;
  metalness?: number;
}

/**
 * A shared procedural hero shape — a distorted, floating solid rendered in
 * the brand's own colours. Deliberately not a literal asset (no GLB models
 * yet); this is the extensible base every brand's Scene.tsx composes.
 */
export function BrandBlob({
  accent,
  accentSoft,
  speed = 0.4,
  distort = 0.35,
  geometry = "icosahedron",
  roughness = 0.25,
  metalness = 0.15,
}: BrandBlobProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * speed * 0.3;
    meshRef.current.rotation.y += delta * speed * 0.5;
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} color={accentSoft} />
      <directionalLight position={[-4, -2, -3]} intensity={0.4} color={accent} />
      <Float speed={speed * 2} rotationIntensity={0.4} floatIntensity={0.8}>
        <mesh ref={meshRef} scale={2.1}>
          {geometry === "icosahedron" && <icosahedronGeometry args={[1, 1]} />}
          {geometry === "sphere" && <sphereGeometry args={[1, 48, 48]} />}
          {geometry === "torus" && <torusGeometry args={[0.8, 0.35, 32, 100]} />}
          {geometry === "box" && <boxGeometry args={[1.4, 1.4, 1.4]} />}
          <MeshDistortMaterial
            color={accent}
            distort={distort}
            speed={speed * 3}
            roughness={roughness}
            metalness={metalness}
          />
        </mesh>
      </Float>
      <Environment preset="city" environmentIntensity={0.4} />
    </>
  );
}
