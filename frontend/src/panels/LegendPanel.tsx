import { motion } from "framer-motion";

const TYPES = [
  { key: "decision",      label: "Decision",  alpha: 1.0  },
  { key: "person",        label: "Person",    alpha: 0.85 },
  { key: "project",       label: "Project",   alpha: 0.8  },
  { key: "tech",          label: "Tech",      alpha: 0.72 },
  { key: "open_question", label: "Question",  alpha: 0.6  },
] as const;

const GLASS = {
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(16px)",
};

export function LegendPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0, 0, 0.2, 1] }}
      className="pointer-events-none fixed left-1/2 top-6 z-20 -translate-x-1/2"
    >
      <div className="flex items-center gap-4 rounded-full px-5 py-2.5" style={GLASS}>
        {TYPES.map(({ key, label, alpha }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{ background: `rgba(255,255,255,${alpha})` }}
            />
            <span
              className="font-mono text-[10px] tracking-wide"
              style={{ color: `rgba(255,255,255,${alpha * 0.65})` }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
