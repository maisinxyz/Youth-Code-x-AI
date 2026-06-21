import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useQueryStore } from "../state/query";
import { useDrawerStore } from "../state/drawer";
import { Volume2, VolumeX, Square } from "lucide-react";
import type { Source } from "../lib/api";

const CHARS_PER_SEC = 30;
const INTERVAL_MS = Math.round(1000 / CHARS_PER_SEC); // ~33ms

const GLASS = {
  background: "rgba(0,0,0,0.60)",
  border: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(16px)",
};

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1 w-1 animate-bounce rounded-full bg-white/40"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

export interface ResponsePanelProps {
  isSpeaking?: boolean;
  onStopTTS?: () => void;
  isTTSMuted?: boolean;
  onToggleMute?: () => void;
}

export function ResponsePanel({ isSpeaking, onStopTTS, isTTSMuted, onToggleMute }: ResponsePanelProps = {}) {
  const { lastResponse, isPending } = useQueryStore();
  const { openDrawer } = useDrawerStore();
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

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

  const visible = isPending || !!lastResponse;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
          className="fixed bottom-24 right-6 z-20 w-80 max-h-[55vh] overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="rounded-2xl p-4 relative" style={GLASS}>
            {/* Header / Controls */}
            {onToggleMute && (
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                {isSpeaking && onStopTTS && (
                  <button
                    onClick={onStopTTS}
                    className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    title="Stop TTS"
                  >
                    <Square size={14} className="fill-current" />
                  </button>
                )}
                <button
                  onClick={onToggleMute}
                  className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  title={isTTSMuted ? "Unmute TTS" : "Mute TTS"}
                >
                  {isTTSMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </div>
            )}
            
            {isPending && !displayedText ? (
              <ThinkingDots />
            ) : (
              <>
                {/* Typewritten answer */}
                <p className="font-mono text-sm leading-relaxed text-white/80 pr-12">
                  {displayedText}
                  {!isDone && (
                    <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse align-middle bg-white/60" />
                  )}
                </p>

                {/* Citation chips — appear only after typewriter completes */}
                <AnimatePresence>
                  {isDone && lastResponse?.sources && lastResponse.sources.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
                      className="mt-3 flex flex-wrap gap-1.5"
                    >
                      {lastResponse.sources.map((src: Source) => (
                        <button
                          key={src.source_id}
                          onClick={() => openDrawer(src)}
                          className="pointer-events-auto rounded-md px-2 py-1 font-mono text-[10px] text-white/45
                                     transition-colors duration-150 hover:text-white/80 active:scale-[0.97]"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.09)",
                          }}
                        >
                          {src.title}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
