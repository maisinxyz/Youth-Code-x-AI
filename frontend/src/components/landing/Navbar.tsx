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
      <div className="flex items-center gap-3 rounded-b-2xl bg-black px-4 py-2 sm:gap-6 md:gap-12 md:rounded-b-3xl md:px-8">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="text-[10px] transition-colors duration-150 sm:text-xs md:text-sm"
            style={{ color: "rgba(225,224,204,0.7)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E1E0CC")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(225,224,204,0.7)")}
          >
            {item.label}
          </a>
        ))}
        <Link
          to="/connect"
          className="group inline-flex items-center gap-2 rounded-full bg-white py-1 pl-4 pr-1 text-xs font-medium text-black transition-all duration-150 hover:gap-3 active:scale-[0.97] sm:text-sm"
        >
          Login
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black transition-transform duration-150 group-hover:scale-110">
            <ArrowRight className="h-3 w-3 text-white" />
          </span>
        </Link>
      </div>
    </nav>
  );
}
