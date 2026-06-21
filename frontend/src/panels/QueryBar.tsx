import { motion } from "framer-motion";
import { ArrowRight, Mic } from "lucide-react";
import { useRef, useState } from "react";
import { useQueryStore } from "../state/query";

export function QueryBar() {
  const [text, setText] = useState("");
  const { sendQuery, isPending } = useQueryStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const q = text.trim();
    if (!q || isPending) return;
    void sendQuery(q);
    setText("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
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
        {/* Mic — placeholder until §16 wires voice input */}
        <button
          disabled
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full opacity-20"
          title="Voice input (§16)"
        >
          <Mic size={14} className="text-white" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything..."
          disabled={isPending}
          className="flex-1 bg-transparent font-mono text-sm text-white/70
                     placeholder:text-white/25 outline-none disabled:opacity-50"
        />

        {isPending ? (
          <span className="h-2 w-2 animate-pulse rounded-full bg-white/45" />
        ) : (
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full
                       bg-white/10 transition-all duration-150 hover:bg-white/20
                       active:scale-[0.97] disabled:opacity-20"
          >
            <ArrowRight size={13} className="text-white" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
