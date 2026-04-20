import { Link, useLocation } from "wouter";
import { Droplet, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/find-donors", label: "Find Donors" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b border-transparent",
        isScrolled ? "glass-panel border-white/10 shadow-lg shadow-black/50 py-3" : "py-5 bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/20 p-2 rounded-xl border border-primary/30 group-hover:bg-primary/30 transition-colors">
            <Droplet className="w-5 h-5 text-primary" fill="currentColor" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">BloodSync</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                location === link.href
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              Register as Donor
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-gray-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full glass-panel border-t border-white/10 p-4 flex flex-col gap-2 shadow-2xl">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "px-4 py-3 rounded-lg text-sm font-medium",
                location === link.href
                  ? "bg-white/10 text-white"
                  : "text-gray-400"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="h-px bg-white/10 my-2" />
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-gray-300">
              Login
            </Button>
          </Link>
          <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full bg-primary text-white hover:bg-primary/90">
              Register as Donor
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
