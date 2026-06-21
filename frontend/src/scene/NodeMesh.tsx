import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import type { GraphNode } from "../lib/api";

// Brightness per semantic node type (monochrome SaaS palette)
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

export function NodeMesh({ node, position, activated = false, phaseOffset = 0 }: NodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const baseScale = useMemo(() => 0.065 + node.weight * 0.065, [node.weight]);
  const baseBrightness = useMemo(() => TYPE_BRIGHTNESS[node.type] ?? 0.7, [node.type]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    // Idle Y bob — subtle, independent per node
    const bob = Math.sin(t * 0.7 + phaseOffset) * 0.04;
    meshRef.current.position.set(position.x, position.y + bob, position.z);

    // Gentle scale breathing
    const breathe = 1 + Math.sin(t * 0.5 + phaseOffset * 1.3) * 0.04;
    const activatedScale = activated ? 1.5 : 1.0;
    const s = baseScale * breathe * activatedScale;
    meshRef.current.scale.setScalar(s);

    // Rotation — slow tumble
    meshRef.current.rotation.y += 0.004;
    meshRef.current.rotation.x += 0.002;

    // Material — emissive ramps up when activated
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const targetEmissive = activated ? 3.5 : baseBrightness * 1.8;
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
