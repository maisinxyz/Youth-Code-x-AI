import { Globe, Code2, Users } from "lucide-react";
import { Link } from "react-router-dom";

const NAV_LINKS = [
  { title: "How it works",  href: "#section-how" },
  { title: "Connectors",    href: "#section-connect" },
  { title: "Brain preview", href: "#section-brain" },
  { title: "Demo",          href: "/connect" },
];

const COMPANY_LINKS = [
  { title: "About",          href: "#" },
  { title: "Careers",        href: "#" },
  { title: "Privacy Policy", href: "#" },
  { title: "Terms of Service", href: "#" },
];

const SOCIAL = [
  { icon: <Globe   className="h-4 w-4" />, href: "#", label: "Website" },
  { icon: <Code2   className="h-4 w-4" />, href: "#", label: "GitHub"  },
  { icon: <Users   className="h-4 w-4" />, href: "#", label: "LinkedIn" },
];

function scrollTo(selector: string) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

export function FooterSection() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-black">
      {/* Top border */}
      <div
        className="h-px w-full"
        style={{
          background:
            "radial-gradient(50% 100% at 50% 0%, rgba(225,224,204,0.14) 0%, transparent 100%)",
        }}
      />

      <div className="w-full">
        {/* Subtle radial glow */}
        <div
          className="absolute inset-x-0 top-0 h-64 pointer-events-none"
          style={{
            background:
              "radial-gradient(35% 80% at 30% 0%, rgba(255,255,255,0.04) 0%, transparent 100%)",
          }}
        />

        {/* Mobile: stacked layout (keeps content centered) */}
        <div className="block md:hidden">
          <div className="relative grid grid-cols-6 gap-6 p-6 md:p-8 items-start">
            <div className="col-span-6 flex flex-col gap-5">
              <span className="font-display text-xl font-extrabold tracking-display text-white/20 w-max">
                ENGRAM
              </span>

              <p className="max-w-sm font-mono text-sm leading-relaxed text-white/35 text-balance">
                The semantic memory layer for the work your team has already done.
                Ingest your sources. Ask anything. Trace every answer.
              </p>

              <div className="flex gap-2">
                {SOCIAL.map(({ icon, href, label }, i) => (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="rounded-md p-1.5 text-white/35 transition-colors duration-150 border border-white/[0.08] hover:bg-white/[0.06] hover:text-white/70"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            <div className="col-span-6 w-full">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/25">Product</span>
                  <div className="flex flex-col gap-0.5">
                    {NAV_LINKS.map(({ href, title }) => {
                      const isScroll = href.startsWith("#");
                      return isScroll ? (
                        <button key={title} onClick={() => scrollTo(href)} className="w-max py-1 font-mono text-sm text-white/45 duration-150 hover:text-white/80">{title}</button>
                      ) : (
                        <Link key={title} to={href} className="w-max py-1 font-mono text-sm text-white/45 duration-150 hover:text-white/80">{title}</Link>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/25">Company</span>
                  <div className="flex flex-col gap-0.5">
                    {COMPANY_LINKS.map(({ href, title }) => (
                      <a key={title} href={href} className="w-max py-1 font-mono text-sm text-white/45 duration-150 hover:text-white/80">{title}</a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: brand flush-left, links flush-right */}
        <div className="hidden md:block relative min-h-[220px]">
          <div className="absolute left-0 top-6 p-8">
            <div className="flex flex-col gap-5">
              <span className="font-display text-xl font-extrabold tracking-display text-white/20 w-max">ENGRAM</span>
              <p className="max-w-sm font-mono text-sm leading-relaxed text-white/35 text-balance">
                The semantic memory layer for the work your team has already done.
                Ingest your sources. Ask anything. Trace every answer.
              </p>

              <div className="flex gap-2 mt-2">
                {SOCIAL.map(({ icon, href, label }, i) => (
                  <a key={i} href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-md p-1.5 text-white/35 transition-colors duration-150 border border-white/[0.08] hover:bg-white/[0.06] hover:text-white/70">{icon}</a>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute right-0 top-6 p-8 flex gap-12 items-start">
            <div className="flex flex-col items-end">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/25">Product</span>
              <div className="flex flex-col gap-0.5 items-end">
                {NAV_LINKS.map(({ href, title }) => {
                  const isScroll = href.startsWith("#");
                  return isScroll ? (
                    <button key={title} onClick={() => scrollTo(href)} className="w-max py-1 font-mono text-sm text-white/45 duration-150 hover:text-white/80 md:text-right">{title}</button>
                  ) : (
                    <Link key={title} to={href} className="w-max py-1 font-mono text-sm text-white/45 duration-150 hover:text-white/80 md:text-right">{title}</Link>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/25">Company</span>
              <div className="flex flex-col gap-0.5 items-end">
                {COMPANY_LINKS.map(({ href, title }) => (
                  <a key={title} href={href} className="w-max py-1 font-mono text-sm text-white/45 duration-150 hover:text-white/80 md:text-right">{title}</a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="px-6 py-5 md:px-8">
          <p className="text-center font-mono text-[11px] font-light text-white/20">© {year} Engram. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
