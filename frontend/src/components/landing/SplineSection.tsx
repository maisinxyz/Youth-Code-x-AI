import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const SPLINE_URL = "https://prod.spline.design/wUmmlzSKWih2GuwO/scene.splinecode";

export function SplineSection() {
  const ref = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "0%" });
  const headlineInView = useInView(headlineRef, { once: true, margin: "-15%" });
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (inView && !shouldMount) {
      setShouldMount(true);
    }
  }, [inView, shouldMount]);

  return (
    <section
      ref={ref}
      className="relative h-[80vh] w-full overflow-hidden bg-bg-void"
    >
      {/* Spline canvas mounts once when in viewport */}
      {shouldMount && (
        <div className="absolute inset-0">
          <spline-viewer url={SPLINE_URL} style={{ width: "100%", height: "100%" }} />
        </div>
      )}

      {/* Edge gradients to blend with surrounding sections */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-bg-base to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg-base to-transparent" />

      {/* Title overlay */}
      <motion.div
        ref={headlineRef}
        initial={{ y: 24, opacity: 0 }}
        animate={headlineInView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
        className="pointer-events-none absolute left-0 top-0 z-10 px-6 pt-24 md:px-12 md:pt-32"
      >
        <p className="mb-3 text-xs uppercase tracking-wide text-text-muted">
          Engineered for thought
        </p>
        <h2 className="max-w-xl font-display text-2xl font-extrabold tracking-display text-text-primary md:text-3xl">
          Built quietly. Runs continuously.
        </h2>
      </motion.div>
    </section>
  );
}
