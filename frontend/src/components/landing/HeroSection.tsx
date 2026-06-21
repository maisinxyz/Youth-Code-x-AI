import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { WordsPullUp } from "../ui/words-pull-up";
import { HeroParticles } from "./HeroParticles";
import { Navbar } from "./Navbar";

export function HeroSection() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-bg-void">
      <HeroParticles />

      {/* Subtle noise overlay */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
        }}
      />

      {/* Vignette gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg-void/40 via-transparent to-bg-void/90" />

      <Navbar />

      <div className="absolute bottom-0 left-0 right-0 px-4 pb-2 sm:px-6 md:px-12">
        <div className="grid grid-cols-12 items-end gap-4">
          <div className="col-span-12 lg:col-span-8">
            <h1 className="font-display text-[26vw] font-extrabold leading-[0.85] tracking-[-0.07em] text-text-primary sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw]">
              <WordsPullUp text="ENGRAM" />
            </h1>
          </div>

          <div className="col-span-12 flex flex-col gap-6 pb-8 lg:col-span-4 lg:pb-12">
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm leading-snug text-text-primary/70 sm:text-base"
            >
              The semantic memory layer for the work your team has already done.
              Ingest your sources. Ask anything. Trace every answer.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="self-start"
            >
              <Link
                to="/connect"
                className="group inline-flex items-center gap-2 rounded-pill bg-accent-default py-1 pl-5 pr-1 text-sm font-medium text-text-inverse transition-all duration-snap hover:gap-3 hover:bg-accent-bright active:scale-[0.97] sm:text-base"
              >
                Login
                <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-void transition-transform duration-snap group-hover:scale-110 sm:h-10 sm:w-10">
                  <ArrowRight className="h-4 w-4 text-text-primary" />
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
