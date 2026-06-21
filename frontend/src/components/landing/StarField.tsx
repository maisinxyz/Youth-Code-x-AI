import { motion, useScroll } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const CREAM = "225,224,204";
const STAR_COUNT = 90;

interface Star {
  x: number;        // %
  y: number;        // %
  size: number;     // px
  opacity: number;  // 0..1
  twinkle: boolean;
  delay: number;
  duration: number;
}

// Deterministic PRNG so stars don't reshuffle on every render.
function seeded(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateStars(): Star[] {
  const rng = seeded(1337);
  return Array.from({ length: STAR_COUNT }, () => {
    const size = 1 + rng() * 2.2;
    const opacity = 0.25 + rng() * 0.55;
    return {
      x: rng() * 100,
      y: rng() * 100,
      size,
      opacity,
      twinkle: rng() > 0.55,
      delay: rng() * 8,
      duration: 3 + rng() * 5,
    };
  });
}

export function StarField() {
  const stars = useMemo(generateStars, []);
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      setVisible(v > 0.04);
    });
    return () => unsub();
  }, [scrollYProgress]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30"
      style={{ mixBlendMode: "screen" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: `rgba(${CREAM},${s.opacity})`,
            boxShadow: `0 0 ${s.size * 2.5}px rgba(${CREAM},${s.opacity * 0.5})`,
          }}
          animate={
            s.twinkle
              ? { opacity: [s.opacity, s.opacity * 0.25, s.opacity] }
              : undefined
          }
          transition={
            s.twinkle
              ? {
                  duration: s.duration,
                  delay: s.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : undefined
          }
        />
      ))}
    </motion.div>
  );
}
