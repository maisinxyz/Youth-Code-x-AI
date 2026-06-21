import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Mic, MicOff } from "lucide-react";
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
  /** Called once mic produces a final transcript — auto-submits. */
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

  // Keep input text in sync with live transcript while listening
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

  /** Toggle mic on/off */
  const handleMicToggle = () => {
    if (isListening) {
      stop();
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setText("");
      start();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      transition={{ duration: 0.7, delay: 0.6, ease: [0, 0, 0.2, 1] }}
      className="fixed bottom-8 left-1/2 z-20"
    >
      {/* Radial bloom */}
      <div 
        className="pointer-events-none absolute bottom-[-32px] left-1/2 -translate-x-1/2 h-[300px] w-[800px]"
        style={{
          background: "radial-gradient(ellipse at bottom, rgba(223, 155, 91, 0.15) 0%, transparent 60%)",
          zIndex: -1,
        }}
      />

      <div
        className="flex items-center gap-3 rounded-full px-5 py-3.5 transition-all duration-300"
        style={{
          background: "rgba(0,0,0,0.7)",
          border: "1px solid rgba(223, 155, 91, 0.4)",
          backdropFilter: "blur(20px)",
          minWidth: "560px",
          boxShadow: "inset 0 0 16px rgba(223, 155, 91, 0.0), 0 0 16px rgba(223, 155, 91, 0.15)",
          animation: "capsulePulse 4s ease-in-out infinite",
        }}
      >
        {/* ── Mic toggle button ───────────────────────────── */}
        <button
          onClick={isSupported ? handleMicToggle : undefined}
          disabled={!isSupported || isPending}
          className={`relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full
                     select-none disabled:opacity-20 transition-colors duration-200
                     ${isListening ? "bg-red-500/20" : ""}`}
          title={isSupported ? (isListening ? "Click to stop" : "Click to speak") : "Voice input not supported in this browser"}
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

          {isListening ? (
            <MicOff
              size={14}
              className="relative z-10 text-red-400 transition-colors duration-150"
            />
          ) : (
            <Mic
              size={14}
              className="relative z-10 transition-colors duration-150"
              style={{ color: "#df9b5b" }}
            />
          )}
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

      {/* Keyframes */}
      <style>{`
        @keyframes micPing {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          70%  { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes capsulePulse {
          0%   { border-color: rgba(223, 155, 91, 0.3); box-shadow: inset 0 0 0 rgba(223, 155, 91, 0), 0 0 12px rgba(223, 155, 91, 0.1); }
          50%  { border-color: rgba(223, 155, 91, 0.6); box-shadow: inset 0 0 12px rgba(223, 155, 91, 0.2), 0 0 24px rgba(223, 155, 91, 0.25); }
          100% { border-color: rgba(223, 155, 91, 0.3); box-shadow: inset 0 0 0 rgba(223, 155, 91, 0), 0 0 12px rgba(223, 155, 91, 0.1); }
        }
      `}</style>
    </motion.div>
  );
}
