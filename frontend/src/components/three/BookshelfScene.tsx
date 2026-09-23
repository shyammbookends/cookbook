"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Environment } from "@react-three/drei";
import type { Group } from "three";

export interface ShelfBook {
  color: string;
  label: string;
}

/**
 * The homepage hero: four brand "spines" standing between two bookends —
 * the name pun, rendered literally. Each spine floats gently in its own
 * brand colour; hovering (desktop) nudges it forward slightly via CSS on
 * the wrapping Link, not here, since Canvas hit-testing per-brand adds
 * complexity this MVP doesn't need — the visual read carries it instead.
 */
export function BookshelfScene({ books }: { books: ShelfBook[] }) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.12;
  });

  const spacing = 1.15;
  const startX = -((books.length - 1) * spacing) / 2;

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 5, 6]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-4, -2, -4]} intensity={0.35} color="#8ea2ff" />

      <group ref={groupRef}>
        {/* Bookends */}
        <RoundedBox args={[0.3, 2.6, 1.6]} radius={0.08} position={[startX - 0.9, 0, 0]}>
          <meshStandardMaterial color="#c6e86b" roughness={0.4} metalness={0.1} />
        </RoundedBox>
        <RoundedBox args={[0.3, 2.6, 1.6]} radius={0.08} position={[-startX + 0.9, 0, 0]}>
          <meshStandardMaterial color="#c6e86b" roughness={0.4} metalness={0.1} />
        </RoundedBox>

        {books.map((book, i) => (
          <Float key={book.label} speed={1.2} rotationIntensity={0.15} floatIntensity={0.35}>
            <RoundedBox args={[0.55, 2.3, 1.4]} radius={0.06} position={[startX + i * spacing, 0, 0]}>
              <meshStandardMaterial color={book.color} roughness={0.5} metalness={0.08} />
            </RoundedBox>
          </Float>
        ))}
      </group>

      <Environment preset="city" environmentIntensity={0.35} />
    </>
  );
}
