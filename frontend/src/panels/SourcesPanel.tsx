import { motion, AnimatePresence } from "framer-motion";
import { Database, ChevronDown } from "lucide-react";
import { useState } from "react";
import { CONNECTOR_LOGOS } from "../lib/connector-icons";
import { useConnectorsStore } from "../state/connectors";
import type { ConnectorName } from "../lib/api";

// ── All 14 Connectors ──────────────────────────────────────────────────
const ALL_CONNECTORS: ConnectorName[] = [
  "slack",
  "notion",
  "drive",
  "confluence",
  "jira",
  "teams",
  "github",
  "linear",
  "figma",
  "asana",
  "discord",
  "dropbox",
  "trello",
  "gmail",
];

const GLASS = {
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(124, 58, 237, 0.15)",
  backdropFilter: "blur(12px)",
};

// ── Single connector row (View-only, no toggle) ───────────────────────
function ConnectorRow({
  name,
  isConnected,
}: {
  name: ConnectorName;
  isConnected: boolean;
}) {
  const logo = CONNECTOR_LOGOS[name];
  if (!logo) return null;

  const dotColor = isConnected
    ? "rgba(74,222,128,0.9)"   // green
    : "rgba(255,255,255,0.15)"; // grey

  const dotGlow = isConnected
    ? "0 0 8px rgba(74,222,128,0.5)"
    : "none";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-colors"
    >
      {/* Logo */}
      <img
        src={logo.src}
        alt={logo.alt}
        className="h-3.5 w-3.5 object-contain flex-shrink-0"
      />

      {/* Label */}
      <span className="w-16 font-mono text-[10px] text-white/35 select-none">
        {logo.alt}
      </span>

      {/* Status dot */}
      <span
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full transition-all duration-500"
        style={{ background: dotColor, boxShadow: dotGlow }}
      />
    </motion.div>
  );
}

// ── Sources panel ─────────────────────────────────────────────────────
export function SourcesPanel() {
  const { connected } = useConnectorsStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const connectedSources = ALL_CONNECTORS.filter((c) => connected.has(c));
  const unconnectedSources = ALL_CONNECTORS.filter((c) => !connected.has(c));

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
        onClick={() => {
          if (isExpanded) {
            // Collapse everything
            setIsExpanded(false);
            setShowMore(false);
          } else {
            setIsExpanded(true);
          }
        }}
      >
        {/* Header */}
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

        {/* Expanded connector list */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="flex flex-col gap-0.5 overflow-hidden"
            >
              {/* Connected sources always visible */}
              {connectedSources.map((name) => (
                <ConnectorRow
                  key={name}
                  name={name}
                  isConnected={true}
                />
              ))}

              {connectedSources.length === 0 && (
                <div className="px-2 py-1.5 text-[10px] font-mono text-white/30 italic">
                  No sources connected
                </div>
              )}

              {/* "More" button (only if there are unconnected sources) */}
              {unconnectedSources.length > 0 && (
                <motion.button
                  layout
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMore(!showMore);
                  }}
                  className="flex items-center justify-center gap-1.5 mt-1 py-1.5 rounded-md font-mono text-[9px] uppercase tracking-widest text-white/20 hover:text-white/40 hover:bg-white/[0.03] transition-all duration-300"
                >
                  <span>{showMore ? "Less" : "More"}</span>
                  <motion.span
                    animate={{ rotate: showMore ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center"
                  >
                    <ChevronDown size={10} />
                  </motion.span>
                </motion.button>
              )}

              {/* Unconnected sources (hidden until "More" is clicked) */}
              <AnimatePresence>
                {showMore && unconnectedSources.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-0.5 overflow-hidden"
                  >
                    {unconnectedSources.map((name) => (
                      <ConnectorRow
                        key={name}
                        name={name}
                        isConnected={false}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
