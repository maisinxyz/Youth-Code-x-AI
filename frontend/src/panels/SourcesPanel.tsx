import { motion } from "framer-motion";
import { CONNECTOR_LOGOS } from "../lib/connector-icons";
import { useConnectorsStore } from "../state/connectors";
import type { ConnectorName } from "../lib/api";

type ConnectorStatus = "idle" | "ingesting" | "done" | "error";

const STATUS_DOT: Record<ConnectorStatus, string> = {
  idle:      "rgba(255,255,255,0.15)",
  ingesting: "rgba(255,255,255,0.55)",
  done:      "rgba(255,255,255,0.85)",
  error:     "rgba(220,80,80,0.85)",
};

const GLASS = {
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(16px)",
};

export function SourcesPanel() {
  const { statuses } = useConnectorsStore();
  const entries = Object.entries(statuses) as [ConnectorName, ConnectorStatus][];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0, 0, 0.2, 1] }}
      className="pointer-events-none fixed bottom-8 left-6 z-20"
    >
      <div className="flex flex-col gap-2 rounded-2xl px-4 py-4" style={GLASS}>
        <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-white/25">
          Sources
        </p>
        {entries.map(([name, status]) => {
          const logo = CONNECTOR_LOGOS[name];
          if (!logo) return null;
          return (
            <div key={name} className="flex items-center gap-2.5">
              <img
                src={logo.src}
                alt={logo.alt}
                className="h-3.5 w-3.5 object-contain"
              />
              <span className="w-16 font-mono text-[10px] text-white/35">
                {logo.alt}
              </span>
              <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors duration-700"
                style={{ background: STATUS_DOT[status] }}
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
