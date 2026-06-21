import { Line } from "@react-three/drei";
import * as THREE from "three";

interface EdgeMeshProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
  strength?: number;
}

export function EdgeMesh({ from, to, strength = 1 }: EdgeMeshProps) {
  const opacity = Math.min(0.18, 0.06 + strength * 0.05);

  return (
    <Line
      points={[from.toArray() as [number, number, number], to.toArray() as [number, number, number]]}
      color="#9aa3b2"
      transparent
      opacity={opacity}
      lineWidth={0.5}
    />
  );
}
