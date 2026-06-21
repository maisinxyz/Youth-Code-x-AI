import { motion } from "framer-motion";

const TYPES = [
  { key: "decision",      label: "Decision",  color: "#f43f5e"  },
  { key: "person",        label: "Person",    color: "#a855f7" },
  { key: "project",       label: "Project",   color: "#3b82f6"  },
  { key: "tech",          label: "Tech",      color: "#10b981" },
  { key: "open_question", label: "Question",  color: "#f59e0b"  },
] as const;

const GLASS = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(223, 155, 91, 0.15)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 4px 24px -4px rgba(223, 155, 91, 0.15)", // Featherlight purple tinted shadow
};

export function LegendPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0, 0, 0.2, 1] }}
      className="pointer-events-none fixed left-1/2 top-6 z-20"
    >
      <div className="flex items-center gap-5 rounded-full px-6 py-2.5" style={GLASS}>
        {TYPES.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{ 
                background: color,
                boxShadow: `0 0 6px ${color}`
              }}
            />
            <span
              className="font-mono text-[9px] uppercase tracking-[0.12em]"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
