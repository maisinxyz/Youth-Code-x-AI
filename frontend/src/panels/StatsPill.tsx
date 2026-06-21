import { motion } from "framer-motion";
import { useGraphStore } from "../state/graph";

const GLASS = {
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(16px)",
};

export function StatsPill() {
  const { nodes, edges } = useGraphStore();
  const isDemo = nodes.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0, 0, 0.2, 1] }}
      className="pointer-events-none fixed right-6 top-6 z-20"
    >
      <div className="flex items-center gap-3 rounded-full px-4 py-2" style={GLASS}>
        <span className="font-mono text-xs text-white/50">
          {isDemo ? "demo" : `${nodes.length}n · ${edges.length}e`}
        </span>
        <span
          className="h-1.5 w-1.5 rounded-full transition-colors duration-500"
          style={{
            background: isDemo
              ? "rgba(255,255,255,0.2)"
              : "rgba(255,255,255,0.75)",
          }}
        />
      </div>
    </motion.div>
  );
}
