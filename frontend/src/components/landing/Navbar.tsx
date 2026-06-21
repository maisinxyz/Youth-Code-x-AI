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
  { href: "#demo", label: "Demo" },
  { href: "#connectors", label: "Connectors" },
]

export function Navbar() {
  return (
    <header 
      className="fixed left-0 right-0 top-0 z-50 border-b border-white/10"
      style={{
        background: "oklch(8% 0 0 / 80%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="flex h-16 md:h-20 w-full items-center justify-between gap-4 px-4 md:px-8">
        
        {/* Left side: Logo + Desktop Nav */}
        <div className="flex items-center gap-6 md:gap-8">
          
          <Link 
            to="/" 
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center transition-opacity hover:opacity-90"
          >
            <img
              src="/engram-logo.png"
              alt="Engram logo"
              className="h-9 w-9 object-contain md:h-10 md:w-10"
              style={{ imageRendering: "crisp-edges" }}
            />
          </Link>
          
          {/* Navigation menu - desktop */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList className="gap-2">
                {navigationLinks.map((link, index) => (
                  <NavigationMenuItem key={index}>
                    <NavigationMenuLink asChild>
                      <a
                        href={link.href}
                        className="border-b-2 border-transparent hover:border-b-[#df9b5b] px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
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
        
        {/* Right side: CTAs and Mobile Menu */}
        <div className="flex items-center gap-2">
          
          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-sm text-white/70">
              <Link to="/auth-proxy">Log In</Link>
            </Button>
            <Button asChild size="sm" className="text-sm font-semibold text-white hover:brightness-110 border-none" style={{ background: "linear-gradient(135deg, #df9b5b 0%, #b45e1b 100%)" }}>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>

          {/* Mobile Menu & CTAs */}
          <div className="flex items-center gap-2 md:hidden">
            <Button asChild size="sm" className="text-xs font-semibold text-white hover:brightness-110 border-none" style={{ background: "linear-gradient(135deg, #df9b5b 0%, #b45e1b 100%)" }}>
              <Link to="/signup">Sign Up</Link>
            </Button>
            
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
              <PopoverContent align="end" className="w-48 p-1 border-white/10 bg-black/95">
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
                    <div className="mx-1 my-1 h-px w-full bg-white/10" />
                    <NavigationMenuItem className="w-full">
                      <NavigationMenuLink asChild>
                        <Link
                          to="/auth-proxy"
                          className="block rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          Log In
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </PopoverContent>
            </Popover>
          </div>

        </div>
      </div>
    </header>
  )
}
