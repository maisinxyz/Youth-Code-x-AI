import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
import { CameraRig } from "./CameraRig";
import { EdgeMesh } from "./EdgeMesh";
import { NodeMesh } from "./NodeMesh";
import { Postprocessing } from "./Postprocessing";
import { computeLayout, makeDemoGraph } from "./layout";
import { useGraphStore } from "../state/graph";

function GraphScene({ activatedIds }: { activatedIds: Set<string> }) {
  const { nodes: storeNodes, edges: storeEdges } = useGraphStore();

  // Fall back to demo graph if backend returned empty
  const { nodes, edges } = useMemo(() => {
    if (storeNodes.length > 0) return { nodes: storeNodes, edges: storeEdges };
    return makeDemoGraph();
  }, [storeNodes, storeEdges]);

  const layout = useMemo(() => computeLayout(nodes, edges), [nodes, edges]);

  // Stable per-node phase offset for idle motion (deterministic by index)
  const phaseOffsets = useMemo(
    () => nodes.map((_, i) => (i * 2.399963) % (Math.PI * 2)),
    [nodes],
  );

  return (
    <>
      {/* Edges — rendered first (behind nodes) */}
      {edges.map((e, i) => {
        const from = layout.get(e.source);
        const to   = layout.get(e.target);
        if (!from || !to) return null;
        const isActive = activatedIds.has(e.source) && activatedIds.has(e.target);
        return (
          <EdgeMesh
            key={i}
            from={from}
            to={to}
            strength={e.strength}
            activated={isActive}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node, i) => {
        const pos = layout.get(node.id);
        if (!pos) return null;
        return (
          <NodeMesh
            key={node.id}
            node={node}
            position={pos}
            activated={activatedIds.has(node.id)}
            phaseOffset={phaseOffsets[i]}
          />
        );
      })}
    </>
  );
}

interface BrainSceneProps {
  activatedIds?: Set<string>;
}

export function BrainScene({ activatedIds = new Set() }: BrainSceneProps) {
  const { fetchGraph } = useGraphStore();

  // Fetch real graph on mount (falls back to demo if backend is unreachable)
  useEffect(() => {
    fetchGraph().catch(() => {});
  }, [fetchGraph]);

  return (
    <Canvas
      className="!h-full !w-full"
      camera={{ position: [0, 1.5, 12], fov: 52 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMappingExposure: 1,
      }}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 14, 28]} />
      <ambientLight intensity={0.05} />
      <pointLight position={[8, 8, 8]}   intensity={0.3} color="#ffffff" />
      <pointLight position={[-6, -4, 6]} intensity={0.15} color="#aaaacc" />

      <Suspense fallback={null}>
        <GraphScene activatedIds={activatedIds} />
      </Suspense>

      <CameraRig />
      <Postprocessing />
    </Canvas>
  );
}
