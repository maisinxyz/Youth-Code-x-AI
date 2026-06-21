import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { WordsPullUp } from "../ui/words-pull-up";
import { Navbar } from "./Navbar";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4";

export function HeroSection() {
  return (
    <section className="h-screen w-full bg-black p-2 md:p-3">
      <div className="relative h-full w-full overflow-hidden rounded-2xl md:rounded-[2rem]">

        {/* Cinematic video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          src={VIDEO_URL}
        />

        {/* Noise texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />

        {/* Gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/80" />

        <Navbar />

        {/* Bottom content — exact PrismaHero layout */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-3 md:px-10 md:pb-4">
          <div className="grid grid-cols-12 items-end gap-4">

            {/* Giant wordmark */}
            <div className="col-span-12 lg:col-span-8">
              <h1
                className="font-display font-extrabold leading-[0.85] tracking-[-0.07em]"
                style={{
                  fontSize: "clamp(4rem, 20vw, 280px)",
                  color: "#E1E0CC",
                }}
              >
                <WordsPullUp text="ENGRAM" />
              </h1>
            </div>

            {/* Tagline + CTA */}
            <div className="col-span-12 flex flex-col gap-5 pb-6 lg:col-span-4 lg:pb-10">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs sm:text-sm md:text-base"
                style={{ color: "rgba(225,224,204,0.65)", lineHeight: 1.35 }}
              >
                The semantic memory layer for the work your team has already
                done. Ingest your sources. Ask anything. Trace every answer.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to="/connect"
                  className="group inline-flex items-center gap-2 self-start rounded-full bg-white py-1 pl-5 pr-1 text-sm font-medium text-black transition-all duration-150 hover:gap-3 active:scale-[0.97] sm:text-base"
                >
                  Login
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform duration-150 group-hover:scale-110 sm:h-10 sm:w-10">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </span>
                </Link>
              </motion.div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
