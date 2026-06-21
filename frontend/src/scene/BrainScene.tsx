import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { CameraRig } from "./CameraRig";
import { EdgeMesh } from "./EdgeMesh";
import { NodeMesh } from "./NodeMesh";
import { Postprocessing } from "./Postprocessing";
import { SpeechPulse } from "./SpeechPulse";
import { computeLayout, makeDemoGraph, type LayoutMap } from "./layout";
import { useGraphStore } from "../state/graph";
import type { GraphEdge, GraphNode } from "../lib/api";

interface GraphSceneProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout: LayoutMap;
  analyserNode?: AnalyserNode | null;
}

function GraphScene({ nodes, edges, layout, analyserNode }: GraphSceneProps) {
  const phaseOffsets = useMemo(
    () => nodes.map((_, i) => (i * 2.399963) % (Math.PI * 2)),
    [nodes],
  );

  return (
    <>
      <SpeechPulse analyserNode={analyserNode} />

      {edges.map((e, i) => {
        const from = layout.get(e.source);
        const to = layout.get(e.target);
        if (!from || !to) return null;
        return <EdgeMesh key={i} from={from} to={to} strength={e.strength} />;
      })}

      {nodes.map((node, i) => {
        const pos = layout.get(node.id);
        if (!pos) return null;
        return (
          <NodeMesh
            key={node.id}
            node={node}
            position={pos}
            phaseOffset={phaseOffsets[i]}
          />
        );
      })}
    </>
  );
}

interface BrainSceneProps {
  activatedIds?: Set<string>;
  analyserNode?: AnalyserNode | null;
}

export function BrainScene({
  activatedIds = new Set(),
  analyserNode,
}: BrainSceneProps) {
  const { fetchGraph, nodes: storeNodes, edges: storeEdges } = useGraphStore();

  useEffect(() => {
    fetchGraph().catch(() => {});
  }, [fetchGraph]);

  // Resolve the live graph (or demo fallback when backend is empty/down).
  const { nodes, edges } = useMemo(() => {
    return { nodes: storeNodes, edges: storeEdges };
  }, [storeNodes, storeEdges]);

  // Layout runs the 50-iter spring relaxation — expensive (O(N²)). Compute
  // once per topology change and reuse for both rendering and centroid math.
  const layout = useMemo(() => computeLayout(nodes, edges), [nodes, edges]);

  // Centroid of activated nodes — drives the CameraRig zoom target.
  const zoomTarget = useMemo<[number, number, number] | null>(() => {
    if (activatedIds.size === 0) return null;
    const sum = new THREE.Vector3();
    let count = 0;
    activatedIds.forEach((id) => {
      const pos = layout.get(id);
      if (pos) {
        sum.add(pos);
        count += 1;
      }
    });
    if (count === 0) return null;
    sum.divideScalar(count);
    return [sum.x, sum.y, sum.z];
  }, [activatedIds, layout]);

  return (
    <Canvas
      className="!h-full !w-full"
      camera={{ position: [0, 2, 18], fov: 52 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMappingExposure: 1,
      }}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 22, 42]} />
      <ambientLight intensity={0.05} />
      <pointLight position={[8, 8, 8]} intensity={0.3} color="#ffffff" />
      <pointLight position={[-6, -4, 6]} intensity={0.15} color="#aaaacc" />

      <Suspense fallback={null}>
        <GraphScene
          nodes={nodes}
          edges={edges}
          layout={layout}
          analyserNode={analyserNode}
        />
      </Suspense>

      <CameraRig zoomTarget={zoomTarget} />
      <Postprocessing />
    </Canvas>
  );
}
