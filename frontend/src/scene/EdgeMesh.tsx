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

  const midY = (from.y + to.y) / 2;
  const mix = Math.min(0.8, Math.max(0, -midY * 0.12));
  
  const c = new THREE.Color("#ffffff");
  const p = new THREE.Color("#7C3AED");
  c.lerp(p, activated ? 0.8 : mix);

  return (
    <Line
      points={[from.toArray() as [number, number, number], to.toArray() as [number, number, number]]}
      color={c}
      transparent
      opacity={opacity}
      lineWidth={width}
    />
  );
}
