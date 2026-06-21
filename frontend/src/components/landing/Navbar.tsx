import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Connectors", href: "#connectors" },
  { label: "Demo", href: "#demo" },
];

export function Navbar() {
  return (
    <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-b-2xl border border-t-0 border-border-subtle bg-bg-base/80 px-2 py-2 pl-4 backdrop-blur-nav sm:gap-6 md:gap-10 md:rounded-b-3xl md:px-3 md:pl-8 lg:gap-12">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="text-xs text-text-secondary transition-colors duration-snap hover:text-text-primary sm:text-sm"
          >
            {item.label}
          </a>
        ))}
        <Link
          to="/connect"
          className="group inline-flex items-center gap-2 rounded-pill bg-accent-default py-1 pl-4 pr-1 text-xs font-medium text-text-inverse transition-all duration-snap hover:gap-3 hover:bg-accent-bright active:scale-[0.97] sm:text-sm"
        >
          Login
          <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-bg-void transition-transform duration-snap group-hover:scale-110">
            <ArrowRight className="h-3.5 w-3.5 text-text-primary" />
          </span>
        </Link>
      </div>
    </nav>
  );
}
