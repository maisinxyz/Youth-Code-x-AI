import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnectorsStore } from "../state/connectors";
import type { ConnectorName } from "../lib/api";

const DEMO_CONNECTORS: ConnectorName[] = ["slack", "notion", "drive", "confluence", "jira", "teams"];

// ── Primary 6 connectors ─────────────────────────────────────────────
const PRIMARY_CONNECTORS = [
  { id: "teams",      label: "Teams",         src: "/logos/teams.svg" },
  { id: "drive",      label: "Google Drive",  src: "/logos/googledrive.svg" },
  { id: "jira",       label: "Jira",          src: "/logos/jira.svg" },
  { id: "slack",      label: "Slack",         src: "/logos/slack.svg" },
  { id: "confluence", label: "Confluence",    src: "/logos/confluence.svg" },
  { id: "notion",     label: "Notion",        src: "/logos/notion.svg" },
];

// ── Additional connectors (shown in "More") ──────────────────────────
const EXTRA_CONNECTORS = [
  { id: "github",  label: "GitHub",   src: "/logos/github.svg" },
  { id: "linear",  label: "Linear",   src: "/logos/linear.svg" },
  { id: "figma",   label: "Figma",    src: "/logos/figma.svg" },
  { id: "asana",   label: "Asana",    src: "/logos/asana.svg" },
  { id: "discord", label: "Discord",  src: "/logos/discord.svg" },
  { id: "dropbox", label: "Dropbox",  src: "/logos/dropbox.svg" },
  { id: "trello",  label: "Trello",   src: "/logos/trello.svg" },
  { id: "gmail",   label: "Gmail",    src: "/logos/gmail.svg" },
];

// ── Connector card ───────────────────────────────────────────────────
function ConnectorCard({
  connector,
  connected,
  onConnect,
  index,
}: {
  connector: { id: string; label: string; src: string };
  connected: boolean;
  onConnect: () => void;
  index: number;
}) {
  const [connecting, setConnecting] = useState(false);

  const handleClick = () => {
    if (connecting) return;
    if (connected) {
      onConnect();
      return;
    }
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      onConnect();
    }, 400 + Math.random() * 300);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={handleClick}
      className={`group relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 text-left w-full
        ${connected
          ? "border-white/20 bg-white/[0.06]"
          : "border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.06] active:scale-[0.98]"
        }
      `}
    >
      {/* Logo */}
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300
        ${connected ? "bg-white/10" : "bg-white/[0.04] group-hover:bg-white/[0.08]"}
      `}>
        <img
          src={connector.src}
          alt={connector.label}
          className={`h-5 w-5 object-contain transition-all duration-300 ${!connected ? "grayscale opacity-50 group-hover:opacity-75" : ""}`}
          draggable={false}
        />
      </div>

      {/* Label */}
      <span className={`font-mono text-sm transition-colors duration-300
        ${connected ? "text-white/70" : "text-white/40 group-hover:text-white/60"}
      `}>
        {connector.label}
      </span>

      {/* Status */}
      <div className="ml-auto flex-shrink-0 flex items-center justify-center w-6 h-6">
        {connecting ? (
          <motion.div
            className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        ) : connected ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
          />
        ) : (
          <span className="font-mono text-[10px] text-white/20 uppercase tracking-wider group-hover:text-white/40 transition-colors">
            Connect
          </span>
        )}
      </div>
    </motion.button>
  );
}

import { WordmarkPanel } from "../panels/WordmarkPanel";

// ── Main Auth Proxy Page ─────────────────────────────────────────────
export default function AuthProxy() {
  const navigate = useNavigate();
  const { connected, toggleConnector, ingestConnector } = useConnectorsStore();
  const [showMore, setShowMore] = useState(false);

  const handleConnect = async (id: string) => {
    toggleConnector(id as ConnectorName);
  };

  const handleBuild = () => {
    // Fire all 6 Meridian ingests in parallel (non-blocking) so the backend
    // store is populated. Backend startup also seeds on first boot, but this
    // ensures freshness if the store was cleared.
    DEMO_CONNECTORS.forEach((name) => void ingestConnector(name));
    navigate("/loading");
  };

  const totalConnected = connected.size;
  const canProceed = totalConnected >= 1;

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      <WordmarkPanel />

      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,255,255,0.02) 0%, transparent 70%)",
        }}
      />

      {/* Content container */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="mb-10 text-center">
          <motion.p
            className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Connect your sources
          </motion.p>
          <motion.h1
            className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Build your brain.
          </motion.h1>
          <motion.p
            className="mt-3 font-mono text-sm text-white/30 max-w-xs mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Select the tools your team uses. Engram will ingest everything.
          </motion.p>
        </div>

        {/* Primary connectors grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {PRIMARY_CONNECTORS.map((c, i) => (
            <ConnectorCard
              key={c.id}
              connector={c}
              connected={connected.has(c.id as ConnectorName)}
              onConnect={() => handleConnect(c.id)}
              index={i}
            />
          ))}
        </div>

        {/* More button + extra connectors */}
        <motion.button
          onClick={() => setShowMore(!showMore)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.01] py-3 font-mono text-xs text-white/25 hover:text-white/40 hover:border-white/10 transition-all duration-300"
        >
          {showMore ? "Show less" : "More sources"}
          {showMore ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </motion.button>

        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 pt-3">
                {EXTRA_CONNECTORS.map((c, i) => (
                  <ConnectorCard
                    key={c.id}
                    connector={c}
                    connected={connected.has(c.id as ConnectorName)}
                    onConnect={() => handleConnect(c.id)}
                    index={i}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status + proceed */}
        <motion.div
          className="mt-8 flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {/* Connected counter */}
          <p className="font-mono text-[11px] text-white/20">
            {totalConnected === 0
              ? "No sources connected"
              : `${totalConnected} source${totalConnected > 1 ? "s" : ""} connected`}
          </p>

          {/* Build your brain CTA */}
          <motion.button
            onClick={handleBuild}
            disabled={!canProceed}
            className={`group inline-flex items-center gap-3 rounded-full py-2 pl-7 pr-2 font-mono text-sm font-medium transition-all duration-300 active:scale-[0.97]
              ${canProceed
                ? "bg-white text-black hover:gap-4"
                : "bg-white/10 text-white/20 cursor-not-allowed"
              }
            `}
            animate={canProceed ? { scale: [1, 1.02, 1] } : {}}
            transition={canProceed ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
          >
            Build your brain
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300
                ${canProceed
                  ? "bg-black group-hover:scale-110"
                  : "bg-white/10"
                }
              `}
            >
              <ArrowRight className={`h-3.5 w-3.5 ${canProceed ? "text-white" : "text-white/30"}`} />
            </span>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Noise texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
}
