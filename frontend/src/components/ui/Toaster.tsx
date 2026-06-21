import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useToastStore, type Toast } from "../../state/toast";

const KIND_STYLES: Record<Toast["kind"], string> = {
  error:   "border-red-500/30   text-red-300",
  success: "border-white/20     text-white/80",
  info:    "border-white/10     text-white/60",
};

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 8,  scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      className={`flex items-start gap-3 rounded-xl px-4 py-3 pr-3 ${KIND_STYLES[toast.kind]}`}
      style={{
        background: "rgba(8,8,8,0.92)",
        border: "1px solid",
        backdropFilter: "blur(16px)",
        maxWidth: "340px",
      }}
    >
      <span className="flex-1 font-mono text-[13px] leading-relaxed">
        {toast.message}
      </span>
      <button
        onClick={() => remove(toast.id)}
        className="mt-0.5 flex-shrink-0 opacity-40 hover:opacity-80 transition-opacity"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
