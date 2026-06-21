import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const SPLINE_URL = "https://prod.spline.design/mdG65j-kMjHPLuEK/scene.splinecode";

export function SplineSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(sectionRef, { once: false, margin: "0%" });
  const [shouldMount, setShouldMount] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const splineScale = useTransform(
    scrollYProgress,
    reduceMotion ? [0, 1] : [0, 0.6, 1],
    reduceMotion ? [1, 1] : [1.08, 1.02, 0.96],
  );
  const splineY = useTransform(
    scrollYProgress,
    reduceMotion ? [0, 1] : [0, 1],
    reduceMotion ? ["0%", "0%"] : ["6%", "-6%"],
  );
  const textOpacity = useTransform(
    scrollYProgress,
    reduceMotion ? [0, 1] : [0.05, 0.2, 0.8, 0.95],
    reduceMotion ? [1, 1] : [0, 1, 1, 0],
  );
  const textY = useTransform(
    scrollYProgress,
    reduceMotion ? [0, 1] : [0.05, 0.2, 0.8, 0.95],
    reduceMotion ? [0, 0] : [24, 0, 0, -24],
  );

  useEffect(() => {
    if (inView && !shouldMount) setShouldMount(true);
  }, [inView, shouldMount]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100vh] w-full overflow-hidden bg-bg-base"
    >
      {shouldMount && (
        <motion.div
          style={{ scale: splineScale, y: splineY }}
          className="absolute inset-0"
        >
          <spline-viewer
            url={SPLINE_URL}
            style={{ width: "100%", height: "100%", background: "transparent" }}
          />
        </motion.div>
      )}

      {/* Edge fades to blend between sections */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-bg-base to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg-base to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg-base to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg-base to-transparent" />

      {/* Aligned copy block with scroll-linked motion */}
      <div className="relative z-10 mx-auto flex min-h-[100vh] max-w-6xl items-center px-6 py-24 md:px-12 md:py-32">
        <motion.div style={{ opacity: textOpacity, y: textY }} className="max-w-xl">
          <p className="mb-3 text-xs uppercase tracking-wide text-text-muted">
            Live memory core
          </p>
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-display text-text-primary md:text-3xl">
            The graph stays awake.
          </h2>
          <p className="text-sm text-text-secondary md:text-base">
            As new context lands, relationships rewire in the background so every
            query traces back to the source.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
