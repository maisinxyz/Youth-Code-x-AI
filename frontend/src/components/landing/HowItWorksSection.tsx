import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const STEPS = [
  {
    n: "01",
    title: "Connect",
    body: "Authorize your active platforms. We continuously index every thread, document, and ticket without migrating a single byte.",
  },
  {
    n: "02",
    title: "Map",
    body: "Raw text becomes structural memory. The system extracts entities and relationships to assemble a spatial graph of your organization.",
  },
  {
    n: "03",
    title: "Query",
    body: "State your question. The engine traverses the graph to synthesize exact answers, backed by hard citations from the original sources.",
  },
];

function StepPanel({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <motion.div
      ref={ref}
      initial={{ y: 32, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : {}}
      transition={{
        duration: 0.6,
        delay: index * 0.12,
        ease: [0, 0, 0.2, 1],
      }}
      className="group relative flex flex-col gap-6 rounded-md border border-border-subtle bg-bg-surface p-8 transition-colors duration-standard hover:border-border-default md:p-12"
    >
      <span className="font-display text-2xl font-extrabold tracking-display text-white/40">
        {step.n}
      </span>
      <h3 className="font-display text-xl font-bold tracking-display text-text-primary">
        {step.title}
      </h3>
      <p className="text-sm leading-normal text-text-secondary md:text-base">
        {step.body}
      </p>

      {/* subtle accent glow on hover */}
      <span className="pointer-events-none absolute inset-0 rounded-md opacity-0 transition-opacity duration-standard group-hover:opacity-100" style={{
        boxShadow: "inset 0 0 60px rgba(255,255,255,0.03)",
      }} />
    </motion.div>
  );
}

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative px-6 pt-32 pb-10 md:px-12 md:pt-48 md:pb-12"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-16 max-w-2xl">
          <p className="mb-3 text-xs uppercase tracking-wide text-text-muted">
            How it works
          </p>
          <h2 className="flex flex-col gap-1 md:gap-2">
            <span className="font-display text-2xl font-extrabold tracking-display text-text-primary md:text-3xl">
              Search less. Know more.
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-text-secondary md:text-2xl">
              Your team with perfect memory.
            </span>
          </h2>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, i) => (
            <StepPanel key={step.n} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
