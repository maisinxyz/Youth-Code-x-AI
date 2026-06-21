import { Line } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const NODE_COUNT = 80;
const RADIUS = 2.6;
const CONNECT_DIST = 1.4;

type NodeDef = { id: string; position: [number, number, number]; size: number };
type EdgeDef = [number, number];

function d3(a: [number, number, number], b: [number, number, number]) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function buildNodes(): NodeDef[] {
  const phi = Math.PI * (Math.sqrt(5) - 1); // golden angle
  return Array.from({ length: NODE_COUNT }, (_, i) => {
    const y = 1 - (i / (NODE_COUNT - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    const rr = RADIUS * (0.88 + Math.sin(i * 7.3) * 0.12);
    return {
      id: `n${i}`,
      position: [
        rr * r * Math.cos(theta) + Math.sin(i * 13.1) * 0.1,
        rr * y + Math.cos(i * 9.7) * 0.1,
        rr * r * Math.sin(theta) + Math.sin(i * 17.3) * 0.1,
      ] as [number, number, number],
      size: 0.025 + Math.sin(i * 3.14) * 0.02 + 0.02,
    };
  });
}

function buildEdges(nodes: NodeDef[]): EdgeDef[] {
  const edges: EdgeDef[] = [];
  for (let i = 0; i < nodes.length; i++) {
    let c = 0;
    for (let j = i + 1; j < nodes.length; j++) {
      if (c >= 5) break;
      if (d3(nodes[i].position, nodes[j].position) < CONNECT_DIST) {
        edges.push([i, j]);
        c++;
      }
    }
  }
  return edges;
}

const NODES = buildNodes();
const EDGES = buildEdges(NODES);
// ~30% of nodes glow bright to drive bloom
const ACTIVE = new Set<number>(NODES.map((_, i) => i).filter((i) => (i * 7919) % 100 < 30));

function NodesMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const phases = useMemo(() => NODES.map((_, i) => (i * 2.39996) % (Math.PI * 2)), []);
  const periods = useMemo(() => NODES.map((_, i) => 3 + ((i * 1.618) % 4)), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.04 + Math.sin(t * 0.05) * 0.07;
    groupRef.current.rotation.x = Math.sin(t * 0.03) * 0.035;
    groupRef.current.children.forEach((child, i) => {
      if (i >= NODES.length) return;
      child.position.y = NODES[i].position[1] + Math.sin((t / periods[i]) * Math.PI * 2 + phases[i]) * 0.025;
    });
  });

  return (
    <group ref={groupRef}>
      {NODES.map((n, i) => {
        const active = ACTIVE.has(i);
        return (
          <mesh key={n.id} position={n.position}>
            <sphereGeometry args={[n.size, 8, 8]} />
            <meshStandardMaterial
              color={active ? "#ffffff" : "#777777"}
              emissive={active ? "#ffffff" : "#333333"}
              emissiveIntensity={active ? 4 : 0.6}
              roughness={0.15}
              metalness={0.05}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function EdgesMesh() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.04 + Math.sin(t * 0.05) * 0.07;
    groupRef.current.rotation.x = Math.sin(t * 0.03) * 0.035;
  });

  return (
    <group ref={groupRef}>
      {EDGES.map(([a, b], idx) => {
        const both = ACTIVE.has(a) && ACTIVE.has(b);
        const one = ACTIVE.has(a) || ACTIVE.has(b);
        return (
          <Line
            key={idx}
            points={[NODES[a].position, NODES[b].position]}
            color={both ? "#ffffff" : one ? "#aaaaaa" : "#444444"}
            transparent
            opacity={both ? 0.95 : one ? 0.4 : 0.15}
            lineWidth={both ? 1.1 : one ? 0.6 : 0.35}
          />
        );
      })}
    </group>
  );
}

export function MiniBrain() {
  return (
    <Canvas
      className="!h-full !w-full"
      camera={{ position: [0, 0, 9], fov: 48 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 6, 18]} />
      <ambientLight intensity={0.1} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-5, -3, 4]} intensity={0.25} color="#ccccff" />
      <NodesMesh />
      <EdgesMesh />
      <EffectComposer>
        <Bloom
          intensity={2.2}
          luminanceThreshold={0.04}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
