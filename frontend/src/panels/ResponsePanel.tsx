import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryStore } from "../state/query";
import { useGraphStore } from "../state/graph";
import { useDrawerStore } from "../state/drawer";
import {
  Volume2,
  VolumeX,
  Square,
  X,
  Sparkles,
  FileText,
  Focus,
  ChevronRight,
  GripHorizontal,
  Minimize2,
  Maximize2,
} from "lucide-react";
import type { Source } from "../lib/api";

const CHARS_PER_SEC = 45;
const INTERVAL_MS = Math.round(1000 / CHARS_PER_SEC);
const MIN_W = 260;
const MAX_W = 600;
const MIN_H = 180;
const MAX_H = 700;

/* ── Thinking indicator (compact) ──────────────────────────────────── */
function ThinkingState() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles size={14} className="text-purple-400/70" />
        </motion.div>
        <span className="font-mono text-xs text-white/40">Searching knowledge graph…</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {[100, 80, 55].map((width, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full"
            style={{
              width: `${width}%`,
              background:
                "linear-gradient(90deg, rgba(124,58,237,0.06), rgba(124,58,237,0.15), rgba(124,58,237,0.06))",
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Source card ────────────────────────────────────────────────────── */
function SourceCard({
  source,
  index,
  onOpen,
}: {
  source: Source;
  index: number;
  onOpen: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      onClick={onOpen}
      className="group flex items-center gap-2.5 w-full rounded-lg p-2.5 text-left transition-all duration-200
                 hover:bg-white/[0.04]"
      style={{ border: "1px solid rgba(255,255,255,0.04)" }}
    >
      <FileText size={12} className="text-purple-400/50 flex-shrink-0" />
      <span className="font-mono text-[11px] text-white/45 group-hover:text-white/70 truncate flex-1 transition-colors">
        {source.title}
      </span>
      <ChevronRight
        size={10}
        className="text-white/15 group-hover:text-white/40 flex-shrink-0 transition-colors"
      />
    </motion.button>
  );
}

/* ── Resize handle component ───────────────────────────────────────── */
function ResizeHandle({
  edge,
  onResize,
}: {
  edge: "left" | "top" | "top-left";
  onResize: (dx: number, dy: number) => void;
}) {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startRef.current = { x: e.clientX, y: e.clientY };
      document.body.style.userSelect = "none";
      document.body.style.cursor =
        edge === "left" ? "ew-resize" : edge === "top" ? "ns-resize" : "nwse-resize";

      const onMove = (ev: PointerEvent) => {
        if (!startRef.current) return;
        const dx = ev.clientX - startRef.current.x;
        const dy = ev.clientY - startRef.current.y;
        startRef.current = { x: ev.clientX, y: ev.clientY };
        onResize(dx, dy);
      };
      const onUp = () => {
        startRef.current = null;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [edge, onResize],
  );

  const base = "absolute z-40";
  const styles: Record<string, string> = {
    left: `${base} left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-purple-500/20 transition-colors`,
    top: `${base} left-0 right-0 top-0 h-1.5 cursor-ns-resize hover:bg-purple-500/20 transition-colors`,
    "top-left": `${base} left-0 top-0 w-3 h-3 cursor-nwse-resize`,
  };

  return <div className={styles[edge]} onPointerDown={onPointerDown} />;
}

/* ── Main ResponsePanel ────────────────────────────────────────────── */
export interface ResponsePanelProps {
  isSpeaking?: boolean;
  onStopTTS?: () => void;
  isTTSMuted?: boolean;
  onToggleMute?: () => void;
}

export function ResponsePanel({
  isSpeaking,
  onStopTTS,
  isTTSMuted,
  onToggleMute,
}: ResponsePanelProps = {}) {
  const { lastResponse, isPending } = useQueryStore();
  const { setActivatedNodes } = useGraphStore();
  const { openDrawer } = useDrawerStore();
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [panelW, setPanelW] = useState(380);
  const [panelH, setPanelH] = useState(420);
  const [isDragging, setIsDragging] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Expand panel when new response arrives
  useEffect(() => {
    if (isPending || lastResponse) {
      setIsCollapsed(false);
      setIsMinimized(false);
      setShowSources(false);
    }
  }, [isPending, lastResponse]);

  // Typewriter effect
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!lastResponse?.answer) {
      setDisplayedText("");
      setIsDone(false);
      return;
    }
    const fullText = lastResponse.answer;
    indexRef.current = 0;
    setDisplayedText("");
    setIsDone(false);

    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      setDisplayedText(fullText.slice(0, indexRef.current));
      if (indexRef.current >= fullText.length) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setIsDone(true);
      }
    }, INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lastResponse]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [displayedText]);

  const handleFocusNodes = () => {
    const ids = lastResponse?.activated_nodes ?? [];
    if (ids.length > 0) setActivatedNodes(ids);
  };

  /** Resize from the left edge → increase width, from top edge → increase height */
  const handleResize = useCallback(
    (dx: number, dy: number) => {
      setPanelW((w) => Math.min(MAX_W, Math.max(MIN_W, w - dx)));
      setPanelH((h) => Math.min(MAX_H, Math.max(MIN_H, h - dy)));
    },
    [],
  );

  const visible = isPending || !!lastResponse;
  const activatedCount = lastResponse?.activated_nodes?.length ?? 0;
  const sourceCount = lastResponse?.sources?.length ?? 0;

  return (
    <AnimatePresence>
      {visible && !isCollapsed && (
        <motion.div
          drag
          dragControls={dragControls}
          dragMomentum={false}
          dragListener={false}
          dragConstraints={{ top: -400, left: -800, right: 200, bottom: 200 }}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-24 right-5 z-30"
          style={{
            width: isMinimized ? 280 : panelW,
            userSelect: isDragging ? "none" : "auto",
          }}
        >
          <div
            className="rounded-2xl overflow-hidden flex flex-col relative"
            style={{
              background: "rgba(8, 8, 16, 0.65)",
              border: "1px solid rgba(124, 58, 237, 0.12)",
              backdropFilter: "blur(28px)",
              boxShadow:
                "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
              height: isMinimized ? 48 : panelH,
              transition: isMinimized
                ? "height 0.35s cubic-bezier(0.16,1,0.3,1)"
                : undefined,
            }}
          >
            {/* Resize handles (hidden when minimized) */}
            {!isMinimized && (
              <>
                <ResizeHandle edge="left" onResize={handleResize} />
                <ResizeHandle edge="top" onResize={handleResize} />
                <ResizeHandle edge="top-left" onResize={handleResize} />
              </>
            )}

            {/* ── Drag handle / header ── */}
            <div
              className="flex items-center justify-between px-3.5 py-2.5 flex-shrink-0 select-none"
              style={{
                borderBottom: isMinimized
                  ? "none"
                  : "1px solid rgba(255,255,255,0.04)",
                cursor: "grab",
              }}
              onPointerDown={(e) => {
                setIsDragging(true);
                dragControls.start(e);
              }}
              onPointerUp={() => setIsDragging(false)}
            >
              <div className="flex items-center gap-2">
                <GripHorizontal size={12} className="text-white/15" />
                <motion.div
                  animate={isPending ? { rotate: 360 } : {}}
                  transition={
                    isPending
                      ? { duration: 3, repeat: Infinity, ease: "linear" }
                      : {}
                  }
                >
                  <Sparkles size={12} className="text-purple-400/60" />
                </motion.div>
                <span className="font-mono text-[10px] text-white/35 uppercase tracking-wider">
                  {isPending ? "Thinking" : "Response"}
                </span>
                {!isPending && activatedCount > 0 && !isMinimized && (
                  <span className="font-mono text-[9px] text-purple-400/40 ml-1">
                    · {activatedCount} nodes
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5">
                {onToggleMute && !isMinimized && (
                  <>
                    {isSpeaking && onStopTTS && (
                      <button
                        onClick={onStopTTS}
                        className="p-1.5 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                      >
                        <Square size={10} className="fill-current" />
                      </button>
                    )}
                    <button
                      onClick={onToggleMute}
                      className="p-1.5 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                    >
                      {isTTSMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsMinimized((p) => !p)}
                  className="p-1.5 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 size={10} /> : <Minimize2 size={10} />}
                </button>
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            </div>

            {/* ── Body (hidden when minimized) ── */}
            {!isMinimized && (
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-3"
                style={{ scrollbarWidth: "none" }}
              >
                {isPending && !displayedText ? (
                  <ThinkingState />
                ) : (
                  <AnimatePresence mode="wait">
                    {!showSources ? (
                      <motion.div
                        key="answer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="font-mono text-[13px] leading-[1.75] text-white/75">
                          {displayedText}
                          {!isDone && (
                            <motion.span
                              className="ml-0.5 inline-block h-3.5 w-px align-middle bg-purple-400/70"
                              animate={{ opacity: [1, 0] }}
                              transition={{
                                duration: 0.5,
                                repeat: Infinity,
                              }}
                            />
                          )}
                        </p>

                        {/* Inline citation chips */}
                        <AnimatePresence>
                          {isDone &&
                            lastResponse?.sources &&
                            lastResponse.sources.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 flex flex-wrap gap-1"
                              >
                                {lastResponse.sources
                                  .slice(0, 3)
                                  .map((src: Source) => (
                                    <button
                                      key={src.source_id}
                                      onClick={() => openDrawer(src)}
                                      className="rounded-md px-2 py-1 font-mono text-[9px] text-white/35
                                                 hover:text-white/60 transition-colors"
                                      style={{
                                        background: "rgba(124, 58, 237, 0.06)",
                                        border:
                                          "1px solid rgba(124, 58, 237, 0.08)",
                                      }}
                                    >
                                      {src.title}
                                    </button>
                                  ))}
                                {lastResponse.sources.length > 3 && (
                                  <button
                                    onClick={() => setShowSources(true)}
                                    className="rounded-md px-2 py-1 font-mono text-[9px] text-purple-400/40 hover:text-purple-400/70 transition-colors"
                                    style={{
                                      border:
                                        "1px solid rgba(124, 58, 237, 0.08)",
                                    }}
                                  >
                                    +{lastResponse.sources.length - 3} more
                                  </button>
                                )}
                              </motion.div>
                            )}
                        </AnimatePresence>
                      </motion.div>
                    ) : (
                      /* Sources sub-page */
                      <motion.div
                        key="sources"
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 15 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-1.5"
                      >
                        <button
                          onClick={() => setShowSources(false)}
                          className="flex items-center gap-1 font-mono text-[9px] text-white/25 hover:text-white/50 transition-colors mb-2"
                        >
                          <ChevronRight size={8} className="rotate-180" />
                          Back
                        </button>
                        {lastResponse?.sources?.map(
                          (src: Source, i: number) => (
                            <SourceCard
                              key={src.source_id}
                              source={src}
                              index={i}
                              onOpen={() => openDrawer(src)}
                            />
                          ),
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            )}

            {/* ── Bottom action bar ── */}
            <AnimatePresence>
              {isDone && !isPending && !isMinimized && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0 px-3.5 py-2.5 flex gap-2"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <button
                    onClick={handleFocusNodes}
                    disabled={activatedCount === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-[10px]
                               transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed
                               hover:bg-purple-500/15"
                    style={{
                      background: "rgba(124, 58, 237, 0.08)",
                      border: "1px solid rgba(124, 58, 237, 0.15)",
                      color: "rgba(167, 139, 250, 0.7)",
                    }}
                  >
                    <Focus size={11} />
                    Focus ({activatedCount})
                  </button>

                  <button
                    onClick={() => setShowSources(true)}
                    disabled={sourceCount === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-[10px]
                               text-white/35 hover:text-white/55 transition-all duration-200
                               disabled:opacity-25 disabled:cursor-not-allowed hover:bg-white/[0.03]"
                    style={{
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <FileText size={11} />
                    Sources ({sourceCount})
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
