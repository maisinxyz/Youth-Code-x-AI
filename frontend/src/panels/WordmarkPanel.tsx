import { motion } from "framer-motion";

export function WordmarkPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0, 0, 0.2, 1] }}
      className="pointer-events-none fixed left-6 top-6 z-20"
    >
      <span className="font-display text-lg font-extrabold tracking-display text-white/80">
        ENGRAM
      </span>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-white/30">
        Company Memory
      </p>
    </motion.div>
  );
}
