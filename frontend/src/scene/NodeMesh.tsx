import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import type { GraphNode } from "../lib/api";
import { speechAmplitudeRef } from "./speechAmplitude";

const TYPE_COLORS: Record<string, string> = {
  decision:      "#f43f5e",
  person:        "#a855f7",
  project:       "#3b82f6",
  tech:          "#10b981",
  open_question: "#f59e0b",
};

const TYPE_BRIGHTNESS: Record<string, number> = {
  decision:      0.7,
  person:        0.7,
  project:       0.7,
  tech:          0.7,
  open_question: 0.7,
};

interface NodeMeshProps {
  node: GraphNode;
  position: THREE.Vector3;
  phaseOffset?: number;
}

export function NodeMesh({ node, position, phaseOffset = 0 }: NodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const baseScale = useMemo(() => 0.045 + node.weight * 0.045, [node.weight]);
  const baseBrightness = useMemo(
    () => TYPE_BRIGHTNESS[node.type] ?? 0.5,
    [node.type],
  );
  
  const color = useMemo(
    () => TYPE_COLORS[node.type] ?? "#ffffff",
    [node.type]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    // Idle Y bob
    const bob = Math.sin(t * 0.7 + phaseOffset) * 0.04;
    meshRef.current.position.set(position.x, position.y + bob, position.z);

    // Scale: breathe + speech pulse modulation while TTS is playing
    const amp = speechAmplitudeRef.current;
    const breathe = 1 + Math.sin(t * 0.5 + phaseOffset * 1.3) * 0.04;
    const speechScale = 1 + amp * 0.12;
    meshRef.current.scale.setScalar(baseScale * breathe * speechScale);

    // Slow tumble
    meshRef.current.rotation.y += 0.004;
    meshRef.current.rotation.x += 0.002;

    // Subtle emissive nudge with speech amplitude — kept under bloom threshold
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const target = baseBrightness + amp * 0.15;
    mat.emissiveIntensity += (target - mat.emissiveIntensity) * 0.1;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={baseBrightness}
        roughness={0.35}
        metalness={0.05}
        toneMapped={false}
      />
    </mesh>
  );
}
