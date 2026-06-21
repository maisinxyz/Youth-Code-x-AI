import { Link } from "react-router-dom";

export default function Brain() {
  return (
    <main className="flex min-h-full items-center justify-center bg-bg-void px-12">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold tracking-display text-text-primary">
          /brain — placeholder
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          3D semantic graph + UI overlays land in §13–§17.
        </p>
        <p className="mt-1 text-xs text-text-muted">
          (Lazy-loaded route — Three.js chunk fetched on demand.)
        </p>
        <Link
          to="/"
          className="mt-6 inline-block text-sm text-accent-bright hover:text-accent-vivid"
        >
          ← back
        </Link>
      </div>
    </main>
  );
}
