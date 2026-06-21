import { AnimatePresence, motion } from "framer-motion";
import { X, ExternalLink, FileText, MessageSquare, Layout, HardDrive, Users, HelpCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { CONNECTOR_LOGOS } from "../lib/connector-icons";
import { useDrawerStore } from "../state/drawer";

// ─── Type → icon mapping ──────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ReactNode> = {
  slack:       <MessageSquare size={13} />,
  notion:      <FileText size={13} />,
  drive:       <HardDrive size={13} />,
  confluence:  <Layout size={13} />,
  jira:        <Layout size={13} />,
  teams:       <Users size={13} />,
};

function SourceTypeIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  const logo = CONNECTOR_LOGOS[t];
  if (logo) {
    return (
      <img src={logo.src} alt={logo.alt} className="h-3.5 w-3.5 object-contain" />
    );
  }
  return (
    <span className="text-white/40">
      {TYPE_ICONS[t] ?? <HelpCircle size={13} />}
    </span>
  );
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - d.getTime();
    const days = diff / (1000 * 60 * 60 * 24);

    if (days < 1) {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    if (days < 7) {
      return d.toLocaleDateString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return ts;
  }
}

// ─── Drawer content ───────────────────────────────────────────────────────────

function DrawerContent() {
  const { activeSource, closeDrawer } = useDrawerStore();
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<Element | null>(null);

  // Capture focus on open, restore on close
  useEffect(() => {
    prevFocusRef.current = document.activeElement;
    closeRef.current?.focus();
    return () => {
      (prevFocusRef.current as HTMLElement | null)?.focus();
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeDrawer]);

  if (!activeSource) return null;

  const src = activeSource;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[25] bg-black/45"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <motion.aside
        key="drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="fixed right-0 top-0 z-30 flex h-full w-80 flex-col"
        style={{
          background: "rgba(6,6,6,0.92)",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-start gap-3 p-5 pb-4">
          <div className="mt-0.5 flex-shrink-0">
            <SourceTypeIcon type={src.type} />
          </div>

          <h2
            id="drawer-title"
            className="flex-1 font-mono text-sm font-medium leading-snug text-white/85"
          >
            {src.title}
          </h2>

          <button
            ref={closeRef}
            onClick={closeDrawer}
            aria-label="Close source drawer"
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md
                       text-white/40 transition-colors duration-150 hover:text-white/80
                       active:scale-[0.97]"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Meta row ── */}
        <div
          className="mx-5 mb-4 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
            {src.type}
          </span>
          <span className="text-white/15">·</span>
          <span className="font-mono text-[10px] text-white/40">
            {src.author}
          </span>
          <span className="text-white/15">·</span>
          <span className="font-mono text-[10px] text-white/30">
            {formatTimestamp(src.timestamp)}
          </span>
        </div>

        {/* ── Divider ── */}
        <div className="mx-5 mb-4 h-px bg-white/[0.06]" />

        {/* ── Excerpt ── */}
        <div className="flex-1 overflow-y-auto px-5" style={{ scrollbarWidth: "none" }}>
          <p className="font-mono text-sm leading-relaxed text-white/65">
            {src.excerpt}
          </p>
        </div>

        {/* ── Footer CTA ── */}
        <div className="p-5 pt-4">
          <div className="h-px bg-white/[0.06] mb-4" />
          <button
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-full py-2.5
                       font-mono text-xs text-white/25 opacity-40 cursor-not-allowed"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            title="Available after hackathon integration (§21)"
          >
            <ExternalLink size={12} />
            View original
          </button>
        </div>
      </motion.aside>
    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function SourceDrawer() {
  const { open } = useDrawerStore();

  return (
    <AnimatePresence>
      {open && <DrawerContent key="drawer-content" />}
    </AnimatePresence>
  );
}
