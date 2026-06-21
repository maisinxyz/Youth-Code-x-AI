import { motion } from "framer-motion";

import { Link } from "react-router-dom";

export function WordmarkPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0, 0, 0.2, 1] }}
      className="fixed left-6 top-6 z-20"
    >
      <Link to="/" className="flex flex-col group">
        <span className="font-display text-lg font-extrabold tracking-display text-white/80 transition-colors group-hover:text-white">
          ENGRAM
        </span>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-white/30 transition-colors group-hover:text-white/50">
          Company Memory
        </p>
      </Link>
    </motion.div>
  );
}
