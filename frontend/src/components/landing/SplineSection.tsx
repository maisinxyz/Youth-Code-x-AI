import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

const SPLINE_URL = "https://prod.spline.design/mdG65j-kMjHPLuEK/scene.splinecode";
const EASE_OUT = [0, 0, 0.2, 1] as const;

export function SplineSection() {
  const sectionRef   = useRef<HTMLElement>(null);
  const splineRef    = useRef<HTMLDivElement>(null);
  const copyRef      = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const inView       = useInView(sectionRef, { once: false, margin: "-5%" });
  const copyInView   = useInView(copyRef, { once: true, margin: "-10%" });
  const [shouldMount, setShouldMount] = useState(false);

  // Scroll parallax — vertical drift on the Spline panel
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const splineY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["8%", "-8%"],
  );

  useEffect(() => {
    if (inView && !shouldMount) setShouldMount(true);
  }, [inView, shouldMount]);

  return (
    <section
      ref={sectionRef}
      className="relative bg-black overflow-hidden"
      style={{ paddingTop: "clamp(80px, 10vw, 140px)" }}
    >
      {/* Subtle background radial glow behind the whole section */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 65% 50%, rgba(255,255,255,0.025) 0%, transparent 70%)",
        }}
      />

      {/* ── Side-by-side grid ──────────────────────────────────────── */}
      <div className="grid min-h-[75vh] grid-cols-1 items-center gap-0 md:grid-cols-[1fr_1.35fr]">

        {/* ── LEFT: Copy column ─────────────────────────────────────── */}
        <div
          ref={copyRef}
          className="relative z-10 flex flex-col justify-center px-8 py-16 md:px-12 md:py-24 lg:px-20"
        >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={copyInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="mb-4 font-mono text-[10px] uppercase tracking-widest text-white/30"
          >
            Semantic substrate
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={copyInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1, ease: EASE_OUT }}
            className="mb-6 font-display text-4xl font-extrabold leading-tight tracking-display text-white lg:text-5xl"
          >
            Every answer
            <br />
            has a lineage.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={copyInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.22, ease: EASE_OUT }}
            className="mb-8 max-w-sm font-mono text-sm leading-relaxed text-white/45"
          >
            Engram maps the connective tissue beneath every decision your
            team has ever made — the meetings that shaped strategy, the
            threads that became policy.
          </motion.p>

          {/* Three micro-stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={copyInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.35, ease: EASE_OUT }}
            className="flex flex-col gap-3"
          >
            {[
              { label: "Query it.",  sub: "Ask anything in natural language." },
              { label: "Cite it.",   sub: "Every answer traces to its source." },
              { label: "Trust it.",  sub: "No hallucinations — only your data." },
            ].map(({ label, sub }) => (
              <div key={label} className="flex items-start gap-3">
                <span
                  className="mt-[3px] h-1 w-1 flex-shrink-0 rounded-full bg-white/40"
                />
                <div>
                  <span className="font-mono text-[11px] font-medium text-white/70">
                    {label}
                  </span>{" "}
                  <span className="font-mono text-[11px] text-white/30">{sub}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT: Spline panel ───────────────────────────────────── */}
        <div
          ref={splineRef}
          className="relative overflow-hidden"
          style={{ minHeight: "clamp(380px, 75vh, 700px)" }}
        >
          {/* Spline with scroll parallax */}
          {shouldMount && (
            <motion.div
              style={{ y: splineY }}
              className="absolute inset-[-6%]"
            >
              <spline-viewer
                url={SPLINE_URL}
                style={{ width: "100%", height: "100%", background: "transparent" }}
              />
            </motion.div>
          )}

          {/* Left edge gradient — blends Spline into the copy column */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-40 z-10"
            style={{
              background: "linear-gradient(to right, #000000 0%, transparent 100%)",
            }}
          />

          {/* Top + bottom fades */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 z-10 bg-gradient-to-b from-black to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 z-10 bg-gradient-to-t from-black to-transparent" />

          {/* Right edge fade */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10"
            style={{
              background: "linear-gradient(to left, #000000 0%, transparent 100%)",
            }}
          />
        </div>
      </div>

      {/* Bottom padding */}
      <div style={{ paddingBottom: "clamp(40px, 5vw, 72px)" }} />
    </section>
  );
}
