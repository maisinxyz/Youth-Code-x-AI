import { Link } from "react-router-dom";

const swatches = [
  { name: "bg-base", className: "bg-bg-base" },
  { name: "bg-surface", className: "bg-bg-surface" },
  { name: "bg-elevated", className: "bg-bg-elevated" },
  { name: "bg-overlay", className: "bg-bg-overlay" },

  { name: "text-primary", className: "bg-text-primary" },
  { name: "text-secondary", className: "bg-text-secondary" },
  { name: "text-muted", className: "bg-text-muted" },
  { name: "border-default", className: "bg-border-default" },

  { name: "accent-muted", className: "bg-accent-muted" },
  { name: "accent-default", className: "bg-accent-default" },
  { name: "accent-bright", className: "bg-accent-bright" },
  { name: "accent-vivid", className: "bg-accent-vivid" },

  { name: "node-rest", className: "bg-node-rest" },
  { name: "node-active", className: "bg-node-active" },
  { name: "status-error", className: "bg-status-error" },
  { name: "status-loading", className: "bg-status-loading" },
];

export default function Landing() {
  return (
    <main className="min-h-full bg-bg-base px-12 py-16">
      <header className="flex items-baseline justify-between border-b border-border-subtle pb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-display text-text-primary">
          ENGRAM
        </h1>
        <span className="text-sm text-text-muted">scaffold ok · §9</span>
      </header>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold tracking-display text-text-secondary">
          Design tokens
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Each swatch reads its color from <code className="text-text-secondary">design/tokens.json</code> via{" "}
          <code className="text-text-secondary">tailwind.config.ts</code>.
        </p>

        <div className="mt-6 grid grid-cols-4 gap-4">
          {swatches.map((s) => (
            <div
              key={s.name}
              className="flex flex-col gap-2 rounded-md border border-border-subtle bg-bg-surface p-3"
            >
              <div className={`h-12 w-full rounded-sm ${s.className}`} />
              <span className="text-xs text-text-muted">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-xl font-bold tracking-display text-text-secondary">
          Routes
        </h2>
        <nav className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/connect"
            className="rounded-pill border border-border-default px-6 py-2 text-sm text-text-primary transition-colors duration-snap hover:border-border-accent hover:text-accent-bright"
          >
            /connect →
          </Link>
          <Link
            to="/loading"
            className="rounded-pill border border-border-default px-6 py-2 text-sm text-text-primary transition-colors duration-snap hover:border-border-accent hover:text-accent-bright"
          >
            /loading →
          </Link>
          <Link
            to="/brain"
            className="rounded-pill border border-border-default px-6 py-2 text-sm text-text-primary transition-colors duration-snap hover:border-border-accent hover:text-accent-bright"
          >
            /brain →
          </Link>
        </nav>
      </section>
    </main>
  );
}
