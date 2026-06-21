import { motion } from "framer-motion";
import { useEffect } from "react";
import { BrainScene } from "../scene/BrainScene";
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
      {/* Full-screen Three.js brain */}
      <div className="absolute inset-0">
        <BrainScene activatedIds={activatedNodeIds} />
      </div>

      {/* Minimal wordmark — top left */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0, 0, 0.2, 1] }}
        className="pointer-events-none absolute left-6 top-6 z-10"
      >
        <span className="font-display text-lg font-extrabold tracking-display text-white/80">
          ENGRAM
        </span>
        <p className="font-mono text-[10px] text-white/30 tracking-widest uppercase mt-0.5">
          Company Memory
        </p>
      </motion.div>

      {/* Node count pill — top right */}
      <NodeStatsPill />

      {/* Placeholder query bar — replaced fully in §15 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6, ease: [0, 0, 0.2, 1] }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <div
          className="flex items-center gap-3 rounded-full px-5 py-3"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-white/50" />
          <span className="font-mono text-sm text-white/50">Ask anything...</span>
          <span className="font-mono text-xs text-white/25">§15</span>
        </div>
      </motion.div>
    </div>
  );
}

function NodeStatsPill() {
  const { nodes, edges } = useGraphStore();
  const count = nodes.length;
  const edgeCount = edges.length;
  const isDemoData = count === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0, 0, 0.2, 1] }}
      className="pointer-events-none absolute right-6 top-6 z-10"
    >
      <div
        className="flex items-center gap-3 rounded-full px-4 py-2"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <span className="font-mono text-xs text-white/50">
          {isDemoData ? "demo" : `${count}n · ${edgeCount}e`}
        </span>
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: isDemoData ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)" }}
        />
      </div>
    </motion.div>
  );
}
