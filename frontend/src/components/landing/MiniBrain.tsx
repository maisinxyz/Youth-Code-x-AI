import { Line } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const NODES: { id: string; position: [number, number, number]; size: number }[] = [
  { id: "n0", position: [-2.4, 0.6, 0], size: 0.36 },
  { id: "n1", position: [-1.2, 1.3, 0.4], size: 0.28 },
  { id: "n2", position: [0.1, 0.9, -0.3], size: 0.32 },
  { id: "n3", position: [1.4, 1.1, 0.2], size: 0.26 },
  { id: "n4", position: [2.5, 0.4, -0.1], size: 0.34 },
  { id: "n5", position: [-2.1, -0.7, 0.3], size: 0.30 },
  { id: "n6", position: [-0.6, -0.5, 0.5], size: 0.28 },
  { id: "n7", position: [0.7, -0.9, -0.4], size: 0.32 },
  { id: "n8", position: [2.0, -0.6, 0.4], size: 0.28 },
  { id: "n9", position: [-1.8, 0.0, -0.6], size: 0.24 },
  { id: "n10", position: [1.0, 0.2, -0.5], size: 0.26 },
  { id: "n11", position: [0.0, 1.7, 0.0], size: 0.30 },
];

const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [5, 6], [6, 7], [7, 8],
  [0, 5], [2, 6], [3, 10], [4, 8],
  [1, 11], [2, 11], [9, 5], [9, 0], [10, 7],
];

const NODE_REST = "#4d4d4d";
const ACCENT = "#5fa68b"; // accent-bright equivalent
const EDGE_REST = "#666666";

function NodesGroup({ activeIndices }: { activeIndices: Set<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const phases = useMemo(
    () => NODES.map(() => Math.random() * Math.PI * 2),
    [],
  );
  const periods = useMemo(
    () => NODES.map(() => 3 + Math.random() * 4),
    [],
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(t * 0.06) * 0.06 + t * 0.02;
    groupRef.current.rotation.x = Math.sin(t * 0.04) * 0.03;

    groupRef.current.children.forEach((child, i) => {
      const baseY = NODES[i].position[1];
      const bob = Math.sin((t / periods[i]) * Math.PI * 2 + phases[i]) * 0.04;
      child.position.y = baseY + bob;
    });
  });

  return (
    <group ref={groupRef}>
      {NODES.map((n, i) => (
        <mesh key={n.id} position={n.position}>
          <octahedronGeometry args={[n.size, 0]} />
          <meshStandardMaterial
            color={activeIndices.has(i) ? ACCENT : NODE_REST}
            emissive={activeIndices.has(i) ? ACCENT : "#000000"}
            emissiveIntensity={activeIndices.has(i) ? 0.7 : 0}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

function EdgesGroup({ activeIndices }: { activeIndices: Set<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(t * 0.06) * 0.06 + t * 0.02;
    groupRef.current.rotation.x = Math.sin(t * 0.04) * 0.03;
  });

  return (
    <group ref={groupRef}>
      {EDGES.map(([a, b], idx) => {
        const isActive = activeIndices.has(a) && activeIndices.has(b);
        return (
          <Line
            key={idx}
            points={[NODES[a].position, NODES[b].position]}
            color={isActive ? ACCENT : EDGE_REST}
            transparent
            opacity={isActive ? 0.85 : 0.25}
            lineWidth={isActive ? 1.4 : 0.8}
          />
        );
      })}
    </group>
  );
}

export function MiniBrain() {
  // A small, fixed cascade pattern — first hop from seed n2 (index 2)
  const activeIndices = useMemo(() => new Set([2, 1, 3, 6, 11]), []);

  return (
    <Canvas
      className="!h-full !w-full"
      camera={{ position: [0, 0, 7], fov: 55 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 4, 14]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[3, 3, 4]} intensity={0.9} color="#ffffff" />
      <pointLight position={[-4, -2, 3]} intensity={0.4} color={ACCENT} />
      <NodesGroup activeIndices={activeIndices} />
      <EdgesGroup activeIndices={activeIndices} />
    </Canvas>
  );
}
