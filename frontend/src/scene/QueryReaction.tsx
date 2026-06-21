import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { GraphEdge, GraphNode } from "../lib/api";
import type { LayoutMap } from "./layout";

interface QueryReactionProps {
  activatedIds: Set<string>;
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout: LayoutMap;
}

// ─── Pulsing halo ring around a single node ───────────────────────────────────

function HaloRing({
  position,
  activated,
  phaseOffset = 0,
}: {
  position: THREE.Vector3;
  activated: boolean;
  phaseOffset?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;

    const targetOpacity = activated ? 0.45 : 0;
    mat.opacity += (targetOpacity - mat.opacity) * 0.08;

    // Pulse scale — slightly out of phase per node so they don't all breathe together
    const pulse = 1 + Math.sin(t * 3.2 + phaseOffset) * 0.14;
    meshRef.current.scale.setScalar(pulse);
  });

  return (
    <mesh ref={meshRef} position={[position.x, position.y, position.z]}>
      <torusGeometry args={[0.24, 0.012, 6, 36]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── Particle traveling along a hot edge ──────────────────────────────────────

function EdgeParticle({
  from,
  to,
  startOffset = 0,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  startOffset?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(startOffset % 1.0);
  const _pos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    tRef.current = (tRef.current + delta * 0.45) % 1.0;
    _pos.lerpVectors(from, to, tRef.current);
    meshRef.current.position.copy(_pos);

    // Fade out near endpoints for a soft look
    const edgeFade = Math.sin(tRef.current * Math.PI);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.7 * edgeFade;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.028, 5, 5]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── Expanding ripple ring from cluster centroid ───────────────────────────────

function Ripple({ centroid }: { centroid: THREE.Vector3 }) {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    for (const [ref, offset] of [
      [ring1, 0] as const,
      [ring2, 0.5] as const,
    ]) {
      if (!ref.current) continue;
      const mat = ref.current.material as THREE.MeshBasicMaterial;

      // Phase stored directly on userData to avoid extra ref
      ref.current.userData.phase =
        ((ref.current.userData.phase ?? offset) + delta * 0.38) % 1.0;
      const t = ref.current.userData.phase;

      const radius = 0.3 + t * 4.2;
      ref.current.scale.setScalar(radius);
      mat.opacity = (1 - t) * 0.28;
    }
  });

  return (
    <group position={[centroid.x, centroid.y, centroid.z]}>
      <mesh ref={ring1} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.016, 5, 56]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.016, 5, 56]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export function QueryReaction({
  activatedIds,
  nodes,
  edges,
  layout,
}: QueryReactionProps) {
  const hotEdges = useMemo(
    () =>
      edges.filter(
        (e) => activatedIds.has(e.source) && activatedIds.has(e.target),
      ),
    [edges, activatedIds],
  );

  const centroid = useMemo(() => {
    if (activatedIds.size === 0) return new THREE.Vector3();
    const sum = new THREE.Vector3();
    let count = 0;
    activatedIds.forEach((id) => {
      const pos = layout.get(id);
      if (pos) {
        sum.add(pos);
        count++;
      }
    });
    return count > 0 ? sum.divideScalar(count) : new THREE.Vector3();
  }, [activatedIds, layout]);

  if (activatedIds.size === 0) return null;

  return (
    <>
      {/* Halo ring per activated node */}
      {nodes
        .filter((n) => activatedIds.has(n.id))
        .map((node, i) => {
          const pos = layout.get(node.id);
          if (!pos) return null;
          return (
            <HaloRing
              key={node.id}
              position={pos}
              activated
              phaseOffset={i * 1.618}
            />
          );
        })}

      {/* Traveling particle per hot edge */}
      {hotEdges.map((e, i) => {
        const from = layout.get(e.source);
        const to = layout.get(e.target);
        if (!from || !to) return null;
        return (
          <EdgeParticle
            key={`${e.source}-${e.target}`}
            from={from}
            to={to}
            startOffset={i * 0.31}
          />
        );
      })}

      {/* Expanding ripple from cluster centroid */}
      <Ripple centroid={centroid} />
    </>
  );
}
