import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import type { GraphNode } from "../lib/api";
import { speechAmplitudeRef } from "./speechAmplitude";

const TYPE_BRIGHTNESS: Record<string, number> = {
  decision:      1.0,
  person:        0.85,
  project:       0.8,
  tech:          0.72,
  open_question: 0.6,
};

interface NodeMeshProps {
  node: GraphNode;
  position: THREE.Vector3;
  activated?: boolean;
  phaseOffset?: number;
}

export function NodeMesh({
  node,
  position,
  activated = false,
  phaseOffset = 0,
}: NodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const zRef = useRef(position.z);

  const baseScale = useMemo(() => 0.065 + node.weight * 0.065, [node.weight]);
  const baseBrightness = useMemo(
    () => TYPE_BRIGHTNESS[node.type] ?? 0.7,
    [node.type],
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    // Z-forward: activated nodes ease toward camera by 1 unit
    const targetZ = activated ? position.z + 1.0 : position.z;
    zRef.current += (targetZ - zRef.current) * 0.05;

    // Idle Y bob
    const bob = Math.sin(t * 0.7 + phaseOffset) * 0.04;
    meshRef.current.position.set(position.x, position.y + bob, zRef.current);

    // Scale: breathe + activated bump + speech pulse modulation
    const amp = speechAmplitudeRef.current;
    const breathe = 1 + Math.sin(t * 0.5 + phaseOffset * 1.3) * 0.04;
    const activatedScale = activated ? 1.5 : 1.0;
    const speechScale = activated ? 1 + amp * 0.55 : 1 + amp * 0.18;
    const s = baseScale * breathe * activatedScale * speechScale;
    meshRef.current.scale.setScalar(s);

    // Rotation — slow tumble
    meshRef.current.rotation.y += 0.004;
    meshRef.current.rotation.x += 0.002;

    // Emissive ramp — activated goes brighter; speech pulse adds a flicker
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const targetEmissive = activated
      ? 3.5 + amp * 2.0
      : baseBrightness * 1.8 + amp * 0.4;
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.08;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={baseBrightness * 1.8}
        roughness={0.25}
        metalness={0.05}
        toneMapped={false}
      />
    </mesh>
  );
}
