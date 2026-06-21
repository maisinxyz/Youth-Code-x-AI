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
        <img 
          src="/engram-logo.png" 
          alt="Engram Logo"
          className="h-9 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
          style={{ filter: "drop-shadow(0 0 12px rgba(124, 58, 237, 0.4))" }}
        />
      </Link>
    </motion.div>
  );
}
