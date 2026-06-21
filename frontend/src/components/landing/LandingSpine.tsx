import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

const CREAM = "225,224,204";

const STATIONS = [
  { id: "section-how",     pos: 0.28 },
  { id: "section-brain",   pos: 0.55 },
  { id: "section-connect", pos: 0.82 },
];

const TICK_COUNT = 48;

export function LandingSpine() {
  const { scrollYProgress } = useScroll();
  // Smooth the scroll-driven indicator
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.4,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [visible, setVisible]   = useState(false);
  const [booted, setBooted]     = useState(false);

  // Reveal the spine once you start leaving the hero.
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      const shouldShow = v > 0.06;
      setVisible(shouldShow);
      if (shouldShow && !booted) setBooted(true);
    });
    return () => unsub();
  }, [scrollYProgress, booted]);

  // Active section via IntersectionObserver.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the entry whose center is closest to viewport center.
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (!visibleEntries.length) return;
        const center = window.innerHeight / 2;
        const best = visibleEntries.reduce((a, b) => {
          const da = Math.abs(a.boundingClientRect.top + a.boundingClientRect.height / 2 - center);
          const db = Math.abs(b.boundingClientRect.top + b.boundingClientRect.height / 2 - center);
          return da < db ? a : b;
        });
        setActiveId(best.target.id);
      },
      { threshold: [0.15, 0.5, 0.85] }
    );

    STATIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // Map scroll progress (0..1) → vertical position on the rail.
  // Rail spans roughly 12vh..88vh of viewport.
  const indicatorY = useTransform(smoothProgress, [0, 1], ["12vh", "88vh"]);
  // Trail length grows slightly with scroll velocity feel.
  const trailHeight = useTransform(smoothProgress, [0, 0.5, 1], [16, 32, 24]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-y-0 right-0 z-40 hidden md:block"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ width: "56px" }}
    >
      <div className="relative h-full w-full">

        {/* ── The rail (faded top/bottom) ─────────────────────────── */}
        <motion.div
          className="absolute left-7 top-0 w-px origin-top"
          style={{
            height: "100%",
            background: `linear-gradient(to bottom,
              transparent 0%,
              rgba(${CREAM},0.14) 10%,
              rgba(${CREAM},0.14) 90%,
              transparent 100%)`,
          }}
          initial={{ scaleY: 0 }}
          animate={booted ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* ── Measurement ticks ──────────────────────────────────── */}
        {Array.from({ length: TICK_COUNT }).map((_, i) => {
          const t = i / (TICK_COUNT - 1);
          // Skip ticks near rail-edge fade.
          if (t < 0.08 || t > 0.92) return null;
          const isMajor = i % 6 === 0;
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: `${t * 100}%`,
                left: isMajor ? "20px" : "22px",
                width: isMajor ? "12px" : "8px",
                height: "1px",
                background: `rgba(${CREAM},${isMajor ? 0.18 : 0.08})`,
              }}
              initial={{ opacity: 0, x: -4 }}
              animate={booted ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
              transition={{
                duration: 0.4,
                delay: 0.4 + t * 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          );
        })}

        {/* ── Station dots + perpendicular labels ─────────────────── */}
        {STATIONS.map((s, i) => {
          const isActive = activeId === s.id;
          return (
            <motion.div
              key={s.id}
              className="absolute"
              style={{ top: `${s.pos * 100}%`, left: "20px" }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={booted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
              transition={{
                duration: 0.5,
                delay: 0.9 + i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Station dot */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 9,
                  height: 9,
                  left: 3,
                  top: -4,
                  border: `1px solid rgba(${CREAM},0.45)`,
                  background: isActive ? `rgba(${CREAM},0.9)` : `rgba(${CREAM},0.08)`,
                  boxShadow: isActive
                    ? `0 0 14px rgba(${CREAM},0.55), 0 0 28px rgba(${CREAM},0.25)`
                    : "none",
                }}
                animate={isActive ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </motion.div>
          );
        })}

        {/* ── Comet indicator (scroll-driven) ─────────────────────── */}
        <motion.div
          className="absolute"
          style={{
            left: 22,
            top: indicatorY,
            translateY: "-50%",
            opacity: booted ? 1 : 0,
          }}
        >
          {/* Trail */}
          <motion.div
            className="absolute left-[5px] w-px"
            style={{
              height: trailHeight,
              top: 6,
              background: `linear-gradient(to bottom, rgba(${CREAM},0.65), transparent)`,
            }}
          />
          {/* Reverse trail (subtle, leading edge) */}
          <div
            className="absolute left-[5px] w-px"
            style={{
              height: 10,
              bottom: 6,
              background: `linear-gradient(to top, rgba(${CREAM},0.35), transparent)`,
            }}
          />
          {/* Glow halo */}
          <div
            className="absolute rounded-full"
            style={{
              width: 22,
              height: 22,
              left: -6,
              top: -6,
              background: `radial-gradient(circle, rgba(${CREAM},0.35) 0%, transparent 70%)`,
              filter: "blur(2px)",
            }}
          />
          {/* Core dot */}
          <motion.div
            className="rounded-full"
            style={{
              width: 10,
              height: 10,
              background: `rgba(${CREAM},0.95)`,
              boxShadow: `0 0 10px rgba(${CREAM},0.7), 0 0 20px rgba(${CREAM},0.35)`,
            }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

      </div>
    </motion.div>
  );
}
