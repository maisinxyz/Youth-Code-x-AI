import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CONNECTOR_LOGOS } from "../../lib/connector-icons";

function ConnectorLogo({ id, size = 24 }: { id: string; size?: number }) {
  const logo = CONNECTOR_LOGOS[id];
  return (
    <img
      src={logo.src}
      alt={logo.alt}
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
      draggable={false}
    />
  );
}

const CONNECTORS = [
  { id: "slack",      name: "Slack" },
  { id: "notion",     name: "Notion" },
  { id: "drive",      name: "Google Drive" },
  { id: "confluence", name: "Confluence" },
  { id: "jira",       name: "Jira" },
  { id: "teams",      name: "Teams" },
] as const;

export function ConnectorMosaic() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <section id="connectors" className="relative px-6 py-24 md:px-12 md:py-32">
      <div className="mx-auto max-w-6xl">
        <header className="mb-16 max-w-2xl">
          <p className="mb-3 text-xs uppercase tracking-wide text-text-muted">
            Connectors
          </p>
          <h2 className="font-display text-2xl font-extrabold tracking-display text-text-primary md:text-3xl">
            Built for every source.
          </h2>
        </header>

        <div ref={ref} className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {CONNECTORS.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ y: 24, opacity: 0 }}
              animate={inView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0, 0, 0.2, 1] }}
              className="group flex flex-col gap-5 rounded-md border border-border-subtle bg-bg-surface p-6 transition-all duration-standard hover:border-white/20 hover:bg-bg-elevated md:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="text-text-secondary transition-colors duration-standard group-hover:text-white">
                  <ConnectorLogo id={c.id} size={22} />
                </span>
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  ready
                </span>
              </div>
              <span className="font-display text-md font-bold tracking-display text-text-primary">
                {c.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
