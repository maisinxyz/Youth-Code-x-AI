import { Button } from "../ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../ui/navigation-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"
import { Link } from "react-router-dom"

const navigationLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#connectors", label: "Connectors" },
  { href: "#demo", label: "Demo" },
]

export function Navbar() {
  return (
    <header 
      className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 px-4 md:px-6"
      style={{
        background: "oklch(8% 0 0 / 80%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl justify-between gap-4">
        {/* Left side */}
        <div className="flex gap-2">
          <div className="flex items-center md:hidden">
            {/* Mobile menu trigger */}
            <Popover>
              <PopoverTrigger asChild>
                <Button className="group size-8 hover:bg-white/5 hover:text-white" variant="ghost" size="icon">
                  <svg
                    className="pointer-events-none"
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 12L20 12"
                      className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                    />
                    <path
                      d="M4 12H20"
                      className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                    />
                    <path
                      d="M4 12H20"
                      className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                    />
                  </svg>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-1 md:hidden border-white/10 bg-black/95">
                <NavigationMenu className="max-w-none *:w-full">
                  <NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
                    {navigationLinks.map((link, index) => (
                      <NavigationMenuItem key={index} className="w-full">
                        <NavigationMenuLink asChild>
                          <a
                            href={link.href}
                            className="block rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            {link.label}
                          </a>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Main nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 no-underline transition-opacity hover:opacity-90">
              <img
                src="/engram-logo.png"
                alt="Engram logo"
                className="h-8 w-8 object-contain"
                style={{ imageRendering: "crisp-edges" }}
              />
              <span
                className="font-display text-xl font-extrabold tracking-tight"
                style={{ color: "#E1E0CC", letterSpacing: "-0.04em" }}
              >
                ENGRAM
              </span>
            </Link>
            
            {/* Navigation menu - desktop */}
            <NavigationMenu className="max-md:hidden">
              <NavigationMenuList className="gap-2">
                {navigationLinks.map((link, index) => (
                  <NavigationMenuItem key={index}>
                    <NavigationMenuLink asChild>
                      <a
                        href={link.href}
                        className="border-b-2 border-transparent hover:border-b-[#2d6a4f] px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        
        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden text-sm md:inline-flex text-white/70">
            <Link to="/connect">Log In</Link>
          </Button>
          <Button asChild size="sm" className="text-sm font-semibold text-white hover:brightness-110 border-none" style={{ background: "oklch(42% 0.095 162)" }}>
            <Link to="/connect">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
