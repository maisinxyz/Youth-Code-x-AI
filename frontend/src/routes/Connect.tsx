import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionWithMockup from "../components/ui/section-with-mockup";
import { useConnectorsStore } from "../state/connectors";
import type { ConnectorName } from "../lib/api";

// ── Connector logo data ──────────────────────────────────────────────
const CONNECTORS = [
  { id: "slack",       label: "Slack",           src: "/logos/slack.svg" },
  { id: "notion",      label: "Notion",          src: "/logos/notion.svg" },
  { id: "drive",       label: "Google Drive",    src: "/logos/googledrive.svg" },
  { id: "confluence",  label: "Confluence",      src: "/logos/confluence.svg" },
  { id: "jira",        label: "Jira",            src: "/logos/jira.svg" },
  { id: "teams",       label: "Teams",           src: "/logos/teams.svg" },
  { id: "github",      label: "GitHub",          src: "/logos/github.svg" },
  { id: "linear",      label: "Linear",          src: "/logos/linear.svg" },
  { id: "figma",       label: "Figma",           src: "/logos/figma.svg" },
  { id: "asana",       label: "Asana",           src: "/logos/asana.svg" },
  { id: "discord",     label: "Discord",         src: "/logos/discord.svg" },
  { id: "dropbox",     label: "Dropbox",         src: "/logos/dropbox.svg" },
  { id: "trello",      label: "Trello",          src: "/logos/trello.svg" },
  { id: "gmail",       label: "Gmail",           src: "/logos/gmail.svg" },
];

// Duplicate for seamless infinite horizontal scroll
const BELT_ITEMS = [...CONNECTORS, ...CONNECTORS, ...CONNECTORS];

// ── Horizontal conveyor belt ─────────────────────────────────────────
function HorizontalBelt() {
  const beltWidth = CONNECTORS.length * 120;

  return (
    <div className="relative w-full overflow-hidden py-6">
      {/* Left fade */}
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-28"
        style={{
          background: "linear-gradient(to right, #000000 0%, transparent 100%)",
        }}
      />
      {/* Right fade */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-28"
        style={{
          background: "linear-gradient(to left, #000000 0%, transparent 100%)",
        }}
      />

      {/* Scrolling row */}
      <motion.div
        className="flex items-center gap-10"
        animate={{ x: [0, -beltWidth] }}
        transition={{
          x: {
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {BELT_ITEMS.map((c, i) => (
          <div
            key={`${c.id}-${i}`}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.07] transition-all duration-300 hover:bg-white/[0.12] hover:border-white/[0.15] hover:scale-110">
              <img
                src={c.src}
                alt={c.label}
                className="h-5 w-5 object-contain"
                draggable={false}
              />
            </div>
            <span className="font-mono text-[9px] text-white/20 tracking-wide whitespace-nowrap">
              {c.label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// The 6 connectors the backend actually supports
const INGESTABLE: ConnectorName[] = ["slack", "notion", "drive", "confluence", "jira", "teams"];

// ── Main page ────────────────────────────────────────────────────────
export default function Connect() {
  const navigate = useNavigate();
  const { ingestConnector } = useConnectorsStore();

  const handleBuild = () => {
    // Fire all 6 ingests in parallel — non-blocking so the loading animation
    // can run concurrently. The brain screen fetches the graph after the
    // animation completes, by which point ingest will be done.
    INGESTABLE.forEach((name) => void ingestConnector(name));
    navigate("/loading");
  };

  return (
    <div className="relative h-screen bg-black overflow-hidden flex flex-col">

      {/* ── "Built for any source" — compact single viewport ── */}
      <div className="flex-1 min-h-0 flex items-center">
        <SectionWithMockup
          compact
          title={
            <span className="font-display tracking-display">
              Built for any source.
            </span>
          }
          description={
            <span className="font-mono text-sm md:text-base">
              Connect any workflow source to Engram — from meeting
              recordings and voice calls to structured notes and documentation.
              Every conversation, every decision, captured and indexed
              so nothing falls through the cracks.
            </span>
          }
          primaryImageSrc="/mockup-notion-voice.png"
          secondaryImageSrc="/mockup-jira-deadline.png"
        >
          {/* CTA inside left column, below text */}
          <motion.div
            className="flex flex-col items-start gap-2 mt-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
          >
            <button
              onClick={handleBuild}
              className="group inline-flex items-center gap-3 rounded-full bg-white py-1.5 pl-6 pr-1.5 font-mono text-sm font-medium text-black transition-all duration-150 hover:gap-4 active:scale-[0.97]"
            >
              Build your brain
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black transition-transform duration-150 group-hover:scale-110">
                <ArrowRight className="h-3.5 w-3.5 text-white" />
              </span>
            </button>
            <p className="font-mono text-[11px] text-white/20 pl-1">
              All sources connected
            </p>
          </motion.div>
        </SectionWithMockup>
      </div>

      {/* ── Divider ── */}
      <div className="mx-auto w-full max-w-3xl px-8">
        <div
          className="h-px w-full"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* ── Horizontal conveyor belt (bottom) ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <HorizontalBelt />
      </motion.div>
    </div>
  );
}
