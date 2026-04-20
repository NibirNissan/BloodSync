import { Link, useLocation } from "wouter";
import { Droplet, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth, routeForRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  const isAuthed = !!user;
  const dashboardHref = routeForRole(profile?.role);

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    // 1. Revoke the Supabase session.
    try { await supabase.auth.signOut(); }
    catch (err) { console.warn("[navbar] supabase.signOut error (continuing):", err); }
    // 2. Also clear the React-side auth context.
    try { await signOut(); } catch { /* non-fatal */ }
    // 3. Wipe every persisted browser state so no token can survive.
    try { localStorage.clear(); } catch { /* non-fatal */ }
    try { sessionStorage.clear(); } catch { /* non-fatal */ }
    // 4. HARD reload to "/" — destroys all React state + Supabase session.
    window.location.href = "/";
  };

  // Admin link is intentionally hidden from public navigation.
  // English labels rendered in Poppins for a sharp, professional feel.
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/find-donors", label: "Find Donors" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <header
      className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 font-en"
    >
      <div className="rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.45)] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 group pl-2 shrink-0">
          <div className="bg-primary/15 p-1.5 rounded-xl border border-primary/30 group-hover:bg-primary/25 transition-colors">
            <Droplet className="w-4 h-4 text-primary" fill="currentColor" />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-white">BloodSync</span>
        </Link>

        {/* Desktop Nav — centered */}
        <nav className="hidden md:flex items-center gap-1 mx-auto">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? location === "/"
                : location === link.href || location.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium tracking-tight transition-all duration-200 whitespace-nowrap",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          {isAuthed ? (
            <>
              <Link href={dashboardHref} className="inline-flex">
                <Button
                  variant="ghost"
                  className={cn(
                    "h-9 px-4 rounded-full text-sm gap-2 transition-all whitespace-nowrap",
                    location === dashboardHref
                      ? "bg-white/10 text-white"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="h-9 px-4 rounded-full text-sm gap-2 whitespace-nowrap text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="inline-flex">
                <Button variant="ghost" className="h-9 px-4 rounded-full text-sm text-gray-300 hover:text-white hover:bg-white/5 whitespace-nowrap">
                  Login
                </Button>
              </Link>
              <Link href="/register" className="inline-flex">
                <Button className="h-9 px-4 rounded-full text-sm font-semibold btn-glow-red text-white border-0 whitespace-nowrap">
                  Register as Donor
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-gray-300 rounded-full hover:bg-white/5"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 mx-2 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-2xl p-3 flex flex-col gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? location === "/"
                : location === link.href || location.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-2xl text-sm font-medium",
                  isActive ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="h-px bg-white/10 my-1" />
          {isAuthed ? (
            <>
              <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 gap-2 rounded-2xl">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="w-full justify-start text-gray-300 gap-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 rounded-2xl">
                  Login
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full btn-glow-red text-white border-0 rounded-2xl">
                  Register as Donor
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
