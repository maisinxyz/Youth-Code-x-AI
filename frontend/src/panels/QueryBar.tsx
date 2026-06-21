import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "../voice/useSpeechRecognition";
import { useQueryStore } from "../state/query";

// Waveform seed heights — vary per bar so they animate distinctly
const BAR_SEEDS = [0.5, 0.85, 0.65, 1.0, 0.55];

function WaveformBars() {
  return (
    <div className="flex flex-1 items-center gap-[3px]">
      {BAR_SEEDS.map((seed, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-white/55"
          animate={{ scaleY: [seed * 0.35, seed, seed * 0.35] }}
          transition={{
            duration: 0.38 + seed * 0.28,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.06,
          }}
          style={{ height: "16px", display: "block", transformOrigin: "center" }}
        />
      ))}
      <span className="ml-2 font-mono text-[11px] text-white/30">listening…</span>
    </div>
  );
}

interface QueryBarProps {
  /** Called once hold-to-talk produces a final transcript — auto-submits. */
  onSubmitTranscript?: (text: string) => void;
}

export function QueryBar({ onSubmitTranscript }: QueryBarProps) {
  const [text, setText] = useState("");
  const { sendQuery, isPending } = useQueryStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const { start, stop, transcript, isListening, isSupported } =
    useSpeechRecognition();

  // 100ms debounced spinner — don't flash spinner for fast responses
  const [showSpinner, setShowSpinner] = useState(false);
  useEffect(() => {
    if (!isPending) { setShowSpinner(false); return; }
    const id = setTimeout(() => setShowSpinner(true), 100);
    return () => clearTimeout(id);
  }, [isPending]);

  // When final transcript arrives after releasing the mic, populate the input
  // and auto-submit
  useEffect(() => {
    if (!transcript) return;
    setText(transcript);
  }, [transcript]);

  // Auto-submit once recognition ends and transcript is populated
  const prevListeningRef = useRef(false);
  useEffect(() => {
    if (prevListeningRef.current && !isListening && transcript.trim()) {
      // Listening just stopped and we have a transcript — fire the query
      void sendQuery(transcript.trim());
      setText("");
      onSubmitTranscript?.(transcript.trim());
    }
    prevListeningRef.current = isListening;
  }, [isListening, transcript, sendQuery, onSubmitTranscript]);

  const submit = () => {
    const q = text.trim();
    if (!q || isPending) return;
    void sendQuery(q);
    setText("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  const handleMicDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent focus loss on touch
    setText("");
    start();
  };

  const handleMicUp = () => {
    stop();
    // Focus input after releasing mic so user can edit the transcript
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.6, ease: [0, 0, 0.2, 1] }}
      className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2"
    >
      <div
        className="flex items-center gap-3 rounded-full px-4 py-3"
        style={{
          background: "rgba(0,0,0,0.65)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(20px)",
          minWidth: "380px",
        }}
      >
        {/* ── Mic button ───────────────────────────────────── */}
        <button
          onMouseDown={isSupported ? handleMicDown : undefined}
          onMouseUp={isSupported ? handleMicUp : undefined}
          onTouchStart={isSupported ? handleMicDown : undefined}
          onTouchEnd={isSupported ? handleMicUp : undefined}
          disabled={!isSupported || isPending}
          className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full
                     select-none disabled:opacity-20"
          title={isSupported ? "Hold to speak" : "Voice input not supported in this browser"}
        >
          {/* Pulsing ring while listening */}
          <AnimatePresence>
            {isListening && (
              <motion.span
                key="ring"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: "rgba(239,68,68,0.2)",
                  boxShadow: "0 0 0 0 rgba(239,68,68,0.4)",
                  animation: "micPing 1.2s ease-out infinite",
                }}
              />
            )}
          </AnimatePresence>

          <Mic
            size={14}
            className="relative z-10 transition-colors duration-150"
            style={{ color: isListening ? "rgb(248,113,113)" : "rgba(255,255,255,0.5)" }}
          />
        </button>

        {/* ── Input / waveform area ─────────────────────── */}
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div
              key="wave"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1"
            >
              <WaveformBars />
            </motion.div>
          ) : (
            <motion.input
              key="input"
              ref={inputRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything…"
              disabled={isPending}
              className="flex-1 bg-transparent font-mono text-sm text-white/75
                         placeholder:text-white/25 outline-none disabled:opacity-40"
            />
          )}
        </AnimatePresence>

        {/* ── Submit / pending indicator ────────────────── */}
        {showSpinner ? (
          <span className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-white/45" />
        ) : (
          <button
            onClick={submit}
            disabled={!text.trim() || isListening}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full
                       bg-white/10 transition-all duration-150 hover:bg-white/20
                       active:scale-[0.97] disabled:opacity-20"
          >
            <ArrowRight size={13} className="text-white" />
          </button>
        )}
      </div>

      {/* Keyframe for mic ping — injected once as a style tag */}
      <style>{`
        @keyframes micPing {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          70%  { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
      `}</style>
    </motion.div>
  );
}
