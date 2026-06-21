import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section className="relative bg-black px-6 py-32 md:px-12 md:py-40">
      <motion.div
        ref={ref}
        initial={{ y: 32, opacity: 0 }}
        animate={inView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
        className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center"
      >
        <p className="text-xs uppercase tracking-wide text-white/40">
          Begin
        </p>
        <h2 className="font-display text-3xl font-extrabold leading-tight tracking-display text-white md:text-hero">
          The work is already done.{" "}
          <br />
          <span className="text-white/55">Let it remember itself.</span>
        </h2>
        <p className="max-w-xl text-sm text-white/45 md:text-base">
          Connect a source. Watch your memory take shape. Ask anything.
        </p>

        <Link
          to="/connect"
          className="group mt-4 inline-flex items-center gap-3 rounded-full bg-white py-2 pl-7 pr-2 text-base font-medium text-black transition-all duration-150 hover:gap-4 active:scale-[0.97] md:text-md"
        >
          Proceed
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black transition-transform duration-150 group-hover:scale-110">
            <ArrowRight className="h-4 w-4 text-white" />
          </span>
        </Link>
      </motion.div>
    </section>
  );
}
