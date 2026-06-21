import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface EdgeMeshProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
  strength?: number;
  activated?: boolean;
}

const BASE_WHITE = new THREE.Color("#ffffff");
const PURPLE = new THREE.Color("#7C3AED");

export function EdgeMesh({ from, to, strength = 1, activated = false }: EdgeMeshProps) {
  const lineRef = useRef<any>(null);
  
  const opacity = activated
    ? Math.min(0.75, 0.35 + strength * 0.2)
    : Math.min(0.22, 0.08 + strength * 0.08);

  const width = activated
    ? 0.9 + strength * 0.4
    : 0.35 + strength * 0.15;

  const midPoint = useMemo(() => new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5), [from, to]);
  const viewPosRef = useRef(new THREE.Vector3());
  const c = useMemo(() => new THREE.Color(), []);

  useFrame(({ camera }) => {
    if (!lineRef.current) return;
    viewPosRef.current.copy(midPoint).project(camera);
    
    const mix = Math.min(0.8, Math.max(0, -viewPosRef.current.y * 0.8));
    c.copy(BASE_WHITE).lerp(PURPLE, activated ? 0.8 : mix);
    
    if (lineRef.current.material) {
      lineRef.current.material.color.copy(c);
    }
  });

  return (
    <Line
      ref={lineRef}
      points={[from.toArray() as [number, number, number], to.toArray() as [number, number, number]]}
      color="#ffffff"
      transparent
      opacity={opacity}
      lineWidth={width}
    />
  );
}
