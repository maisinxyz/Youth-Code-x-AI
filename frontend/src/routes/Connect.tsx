import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FallingPattern } from "../components/ui/falling-pattern";
import { CONNECTOR_LOGOS } from "../lib/connector-icons";
import { useConnectorsStore } from "../state/connectors";

// ----- Logo renderer -----
function ConnectorLogo({ id, size = 40 }: { id: string; size?: number }) {
  const logo = CONNECTOR_LOGOS[id];
  return (
    <img
      src={logo.src}
      alt={logo.alt}
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
      draggable={false}
    />
  );
}

// ----- Connector list -----
const CONNECTORS = [
  { id: "slack",       label: "Slack" },
  { id: "notion",      label: "Notion" },
  { id: "drive",       label: "Google Drive" },
  { id: "confluence",  label: "Confluence" },
  { id: "jira",        label: "Jira" },
  { id: "teams",       label: "Teams" },
] as const;

type ConnectorId = (typeof CONNECTORS)[number]["id"];

// ----- Card -----
function ConnectorCard({
  id,
  label,
  selected,
  loading,
  onToggle,
}: {
  id: ConnectorId;
  label: string;
  selected: boolean;
  loading: boolean;
  onToggle: (id: ConnectorId) => void;
}) {
  return (
    <motion.button
      onClick={() => onToggle(id)}
      whileTap={{ scale: 0.95 }}
      animate={selected ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
      className="group relative flex flex-col items-center justify-center gap-5 rounded-xl p-8 text-center transition-colors duration-150 focus:outline-none"
      style={{
        background: selected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${selected ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.08)"}`,
        boxShadow: selected ? "0 0 40px rgba(255,255,255,0.07)" : "none",
      }}
    >
      {/* Check badge */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
            className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white"
          >
            <Check className="h-3 w-3 text-black" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      )}

      <span style={{ color: selected ? "#ffffff" : "rgba(255,255,255,0.45)" }}>
        <ConnectorLogo id={id} size={34} />
      </span>

      <span
        className="font-mono text-sm font-medium tracking-wide"
        style={{ color: selected ? "#ffffff" : "rgba(255,255,255,0.4)" }}
      >
        {label}
      </span>
    </motion.button>
  );
}

// ----- Route -----
export default function Connect() {
  const navigate = useNavigate();
  const { ingestConnector } = useConnectorsStore();
  const [selected, setSelected] = useState<Set<ConnectorId>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<ConnectorId>>(new Set());

  const toggle = useCallback(
    async (id: ConnectorId) => {
      if (loadingIds.has(id)) return;

      if (selected.has(id)) {
        setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
        return;
      }

      setSelected((prev) => new Set([...prev, id]));
      setLoadingIds((prev) => new Set([...prev, id]));
      try {
        await ingestConnector(id);
      } catch {
        // demo stub always returns 200
      } finally {
        setLoadingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      }
    },
    [selected, loadingIds, ingestConnector],
  );

  const selectAll = useCallback(async () => {
    const allIds = CONNECTORS.map((c) => c.id as ConnectorId);
    setSelected(new Set(allIds));
    await Promise.all(
      allIds.map((id) => {
        setLoadingIds((prev) => new Set([...prev, id]));
        return ingestConnector(id)
          .catch(() => {})
          .finally(() =>
            setLoadingIds((prev) => { const n = new Set(prev); n.delete(id); return n; }),
          );
      }),
    );
  }, [ingestConnector]);

  const canProceed = selected.size > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">

      {/* Falling-lines atmospheric background */}
      <FallingPattern
        color="rgba(255,255,255,0.3)"
        backgroundColor="#000000"
        duration={120}
        blurIntensity="0.8em"
        density={1}
        className="absolute inset-0"
      />

      {/* Radial vignette — darkens center so cards pop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 70% at 50% 45%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 100%)",
        }}
      />

      {/* Page content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-xs uppercase tracking-widest text-white/35">
            Step 1
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-display text-white md:text-4xl lg:text-5xl">
            Connect your sources.
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/45 md:text-base">
            Select the tools your team already lives in.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0, 0, 0.2, 1] }}
          className="w-full max-w-3xl"
        >
          <div className="mb-5 flex justify-end">
            <button
              onClick={selectAll}
              className="text-xs text-white/35 transition-colors duration-150 hover:text-white/65"
            >
              Select all
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
            {CONNECTORS.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.07, ease: [0, 0, 0.2, 1] }}
              >
                <ConnectorCard
                  id={c.id}
                  label={c.label}
                  selected={selected.has(c.id)}
                  loading={loadingIds.has(c.id)}
                  onToggle={toggle}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <AnimatePresence>
          {canProceed && (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
              className="mt-12 flex flex-col items-center gap-3"
            >
              <button
                onClick={() => navigate("/loading")}
                className="group inline-flex items-center gap-3 rounded-full bg-white py-2 pl-7 pr-2 text-base font-medium text-black transition-all duration-150 hover:gap-4 active:scale-[0.97]"
              >
                Build your brain
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black transition-transform duration-150 group-hover:scale-110">
                  <ArrowRight className="h-4 w-4 text-white" />
                </span>
              </button>
              <p className="text-xs text-white/30">
                {selected.size} source{selected.size !== 1 ? "s" : ""} connected
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
