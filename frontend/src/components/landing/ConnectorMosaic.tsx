import { motion, useInView } from "framer-motion";
import {
  Box,
  FileText,
  FolderOpen,
  GitBranch,
  Hash,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRef } from "react";

type ConnectorCard = {
  name: string;
  icon: LucideIcon;
};

const CONNECTORS: ConnectorCard[] = [
  { name: "Slack", icon: Hash },
  { name: "Notion", icon: FileText },
  { name: "Drive", icon: FolderOpen },
  { name: "Confluence", icon: Box },
  { name: "Jira", icon: GitBranch },
  { name: "Teams", icon: Users },
];

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
          {CONNECTORS.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.name}
                initial={{ y: 24, opacity: 0 }}
                animate={inView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0, 0, 0.2, 1] }}
                className="group relative flex flex-col gap-6 rounded-md border border-border-subtle bg-bg-surface p-6 transition-all duration-standard hover:border-white/20 hover:bg-bg-elevated md:p-8"
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-6 w-6 text-text-secondary transition-colors duration-standard group-hover:text-white" />
                  <span className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                    ready
                  </span>
                </div>
                <span className="font-display text-md font-bold tracking-display text-text-primary">
                  {c.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
