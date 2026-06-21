import { Line } from "@react-three/drei";
import * as THREE from "three";

interface EdgeMeshProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
  strength?: number;
  activated?: boolean;
}

export function EdgeMesh({ from, to, strength = 1, activated = false }: EdgeMeshProps) {
  const opacity = activated
    ? Math.min(0.75, 0.35 + strength * 0.2)
    : Math.min(0.22, 0.08 + strength * 0.08);

  const width = activated
    ? 0.9 + strength * 0.4
    : 0.35 + strength * 0.15;

  return (
    <Line
      points={[from.toArray() as [number, number, number], to.toArray() as [number, number, number]]}
      color="#ffffff"
      transparent
      opacity={opacity}
      lineWidth={width}
    />
  );
}
