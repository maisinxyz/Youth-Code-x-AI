import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const SPLINE_URL = "https://prod.spline.design/wUmmlzSKWih2GuwO/scene.splinecode";

export function SplineSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: false, margin: "0%" });
  const headlineInView = useInView(headlineRef, { once: true, margin: "-10%" });
  const [shouldMount, setShouldMount] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const textY = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  useEffect(() => {
    if (inView && !shouldMount) setShouldMount(true);
  }, [inView, shouldMount]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[100vh] w-full overflow-hidden bg-black"
    >
      {shouldMount && (
        <div className="absolute inset-0">
          <spline-viewer
            url={SPLINE_URL}
            style={{ width: "100%", height: "100%", background: "transparent" }}
          />
        </div>
      )}

      {/* Strong fades to integrate seamlessly */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent" />

      {/* Editorial text with parallax */}
      <motion.div
        ref={headlineRef}
        style={{ y: textY }}
        className="pointer-events-none absolute inset-0 flex flex-col items-start justify-end px-8 pb-20 md:px-16 md:pb-28"
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={headlineInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
          className="mb-3 text-xs uppercase tracking-widest text-white/35"
        >
          Engineered for thought
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={headlineInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.1, ease: [0, 0, 0.2, 1] }}
          className="max-w-lg font-display text-3xl font-extrabold leading-tight tracking-display text-white md:text-4xl"
        >
          Built quietly.
          <br />
          Runs continuously.
        </motion.h2>
      </motion.div>
    </section>
  );
}
