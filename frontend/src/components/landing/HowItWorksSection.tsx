import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const STEPS = [
  {
    n: "01",
    title: "Connect",
    body: "Plug in Slack, Notion, Drive, Confluence, Jira, Teams. Engram ingests messages, docs, decisions — every source your team already lives in.",
  },
  {
    n: "02",
    title: "Build",
    body: "We extract entities, relationships, and decisions. The semantic graph assembles itself in 3D — sectioned by source, lit by meaning.",
  },
  {
    n: "03",
    title: "Ask",
    body: "Speak or type. The cascade travels the graph, surfaces the relevant context, and answers with traceable sources.",
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
      className="relative px-6 py-24 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-16 max-w-2xl">
          <p className="mb-3 text-xs uppercase tracking-wide text-text-muted">
            How it works
          </p>
          <h2 className="font-display text-2xl font-extrabold tracking-display text-text-primary md:text-3xl">
            Three steps. Built once. Queried forever.
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
