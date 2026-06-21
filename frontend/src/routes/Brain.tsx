import { useEffect } from "react";
import { BrainScene } from "../scene/BrainScene";
import { LegendPanel } from "../panels/LegendPanel";
import { QueryBar } from "../panels/QueryBar";
import { ResponsePanel } from "../panels/ResponsePanel";
import { SourcesPanel } from "../panels/SourcesPanel";
import { StatsPill } from "../panels/StatsPill";
import { WordmarkPanel } from "../panels/WordmarkPanel";
import { useGraphStore } from "../state/graph";
import { useQueryStore } from "../state/query";

export default function Brain() {
  const { activatedNodeIds, setActivatedNodes, clearActivated } = useGraphStore();
  const { lastResponse } = useQueryStore();

  // Wire: query response activated_nodes → graph store → NodeMesh glow + QueryReaction
  useEffect(() => {
    if (!lastResponse) {
      clearActivated();
      return;
    }
    const ids = lastResponse.activated_nodes ?? [];
    if (ids.length > 0) {
      setActivatedNodes(ids);
    } else {
      clearActivated();
    }
  }, [lastResponse, setActivatedNodes, clearActivated]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Full-screen Three.js brain — pointer-events passthrough */}
      <div className="absolute inset-0">
        <BrainScene activatedIds={activatedNodeIds} />
      </div>

      {/* ── Top row ── */}
      <WordmarkPanel />
      <LegendPanel />
      <StatsPill />

      {/* ── Bottom row ── */}
      <SourcesPanel />
      <QueryBar />
      <ResponsePanel />
    </div>
  );
}
