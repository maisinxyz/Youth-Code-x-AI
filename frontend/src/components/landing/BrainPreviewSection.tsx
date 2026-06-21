import { motion, useInView } from "framer-motion";
import { useRef } from "react";

import { ContainerScroll } from "../ui/container-scroll-animation";
import { BrainVideo } from "./BrainVideo";

export function BrainPreviewSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-20%" });

  return (
    <section id="demo" className="relative bg-bg-base">
      <ContainerScroll
        titleComponent={
          <motion.div
            ref={headerRef}
            initial={{ y: 24, opacity: 0 }}
            animate={headerInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
            className="px-6"
          >
            <p
              className="mb-3 font-mono text-xs uppercase tracking-wide"
              style={{ color: "rgba(225,224,204,0.6)" }}
            >
              The brain
            </p>
            <h2 className="mb-4 font-display text-2xl font-extrabold tracking-display text-text-primary md:text-3xl">
              Your company memory, mapped.
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-text-secondary md:text-base">
              Every decision, document, and conversation — connected. The
              cascade lights the path from question to answer.
            </p>
          </motion.div>
        }
      >
        <BrainVideo />
      </ContainerScroll>
    </section>
  );
}
