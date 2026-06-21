import { motion, AnimatePresence } from "framer-motion";
import { Database } from "lucide-react";
import { useState } from "react";
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
  border: "1px solid rgba(124, 58, 237, 0.15)",
  backdropFilter: "blur(12px)",
};

export function SourcesPanel() {
  const { statuses } = useConnectorsStore();
  const entries = Object.entries(statuses) as [ConnectorName, ConnectorStatus][];
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0, 0, 0.2, 1] }}
      className="fixed bottom-8 left-6 z-20 flex flex-col items-start"
    >
      <div 
        className="flex flex-col rounded-2xl p-4 cursor-pointer overflow-hidden transition-all duration-500 hover:bg-white/[0.02]" 
        style={GLASS}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
           <Database size={14} className="text-white/40" />
           <AnimatePresence>
             {isExpanded && (
               <motion.span 
                 initial={{ opacity: 0, width: 0 }}
                 animate={{ opacity: 1, width: "auto" }}
                 exit={{ opacity: 0, width: 0 }}
                 className="font-mono text-[9px] uppercase tracking-widest text-white/40 whitespace-nowrap overflow-hidden"
               >
                 Sources
               </motion.span>
             )}
           </AnimatePresence>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="flex flex-col gap-2 overflow-hidden"
            >
              {entries.map(([name, status]) => {
                const logo = CONNECTOR_LOGOS[name];
                if (!logo) return null;
                return (
                  <div key={name} className="group relative flex items-center gap-2.5 px-2 py-1.5 transition-colors hover:bg-white/[0.04] rounded-md">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full bg-[#7C3AED] opacity-0 transition-opacity group-hover:opacity-100" />
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      className="h-3.5 w-3.5 object-contain"
                    />
                    <span className="w-16 font-mono text-[10px] text-white/35 transition-colors group-hover:text-white/60">
                      {logo.alt}
                    </span>
                    <span
                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors duration-700"
                      style={{ background: STATUS_DOT[status], boxShadow: `0 0 6px ${STATUS_DOT[status]}` }}
                    />
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
