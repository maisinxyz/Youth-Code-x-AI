import { Link } from "react-router-dom";

export default function Loading() {
  return (
    <main className="flex min-h-full items-center justify-center bg-bg-void px-12">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold tracking-display text-text-primary">
          /loading — placeholder
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          Brain emergence sequence lands in §12.
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
