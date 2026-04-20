import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, User, Droplet, Lock, Eye, EyeOff, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, routeForRole } from "@/lib/auth";

const ADMIN_PIN = "admin1234";

type Mode = "user" | "admin";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, profile, signInWithPassword } = useAuth();

  const [mode, setMode] = useState<Mode>("user");
  const [isLoading, setIsLoading] = useState(false);

  // user (Supabase) fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // admin PIN fields (kept as a quick fallback into the admin panel)
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [adminError, setAdminError] = useState(false);

  // If already logged in, route to the right dashboard immediately.
  useEffect(() => {
    if (user && profile) {
      setLocation(routeForRole(profile.role));
    }
  }, [user, profile, setLocation]);

  // Show a redirect overlay between sign-in and profile arrival
  // so the user can't submit twice while we resolve their role.
  const redirecting = !!user && !profile;
  if (redirecting) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Signing you in…</p>
        </div>
      </div>
    );
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithPassword(email, password);
      // Fetch fresh profile to decide route (auth context will populate too).
      // Defer the route until profile arrives via the useEffect above as a backup.
      toast({ title: "Welcome back", description: "Signing you in…" });
    } catch (err: any) {
      toast({
        title: "Sign in failed",
        description: err?.message || "Check your email and password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin !== ADMIN_PIN) {
      setAdminError(true);
      setTimeout(() => setAdminError(false), 1200);
      return;
    }
    setIsLoading(true);
    sessionStorage.setItem("bloodsync_admin", "true");
    setTimeout(() => {
      setIsLoading(false);
      toast({ title: "Admin access granted", description: "Redirecting to dashboard…" });
      setLocation("/dashboard");
    }, 400);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center w-full px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 mb-6">
            {mode === "admin"
              ? <Shield className="w-7 h-7 text-primary" />
              : <Droplet className="w-7 h-7 text-primary" fill="currentColor" />}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            {mode === "admin" ? "Admin Sign In" : "আবার স্বাগতম"}
          </h1>
          <p className="text-gray-400 text-sm">
            {mode === "admin"
              ? "সংরক্ষিত এলাকা — অ্যাডমিন পরিচয় প্রয়োজন"
              : "আপনার BloodSync অ্যাকাউন্টে সাইন ইন করুন"}
          </p>
        </div>

        <div className="flex p-1 mb-6 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-full">
          <button
            type="button"
            onClick={() => setMode("user")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all ${
              mode === "user" ? "bg-white/10 text-white shadow-inner" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <User className="w-4 h-4" />
            User
          </button>
          <button
            type="button"
            onClick={() => setMode("admin")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all ${
              mode === "admin" ? "bg-primary/20 text-primary border border-primary/30" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
        </div>

        <GlassCard className="p-7">
          <AnimatePresence mode="wait">
            {mode === "user" ? (
              <motion.form
                key="user"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleUserSubmit}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 text-sm flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-500" />
                    Email
                  </Label>
                  <Input
                    id="email" type="email" autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary placeholder:text-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-300 text-sm flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-gray-500" />
                      Password
                    </Label>
                  </div>
                  <Input
                    id="password" type="password" autoComplete="current-password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary placeholder:text-gray-600"
                  />
                </div>
                <Button
                  type="submit" disabled={isLoading}
                  className="w-full h-12 font-semibold btn-glow-red text-white rounded-xl border-0"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</>
                  ) : "Sign In"}
                </Button>
                <div className="text-center text-sm text-gray-500 space-y-1">
                  <p>
                    অ্যাকাউন্ট নেই?{" "}
                    <a href="/register-user" className="text-white hover:text-primary transition-colors font-medium">
                      Sign up as User
                    </a>
                  </p>
                  <p>
                    রক্ত দিতে চান?{" "}
                    <a href="/register" className="text-white hover:text-primary transition-colors font-medium">
                      Register as Donor
                    </a>
                  </p>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="admin"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleAdminSubmit}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-gray-300 text-sm flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    Admin PIN
                  </Label>
                  <div className="relative">
                    <Input
                      id="pin"
                      type={showPin ? "text" : "password"}
                      value={pin}
                      onChange={e => setPin(e.target.value)}
                      placeholder="Enter admin PIN"
                      required
                      className={`bg-white/5 border-white/10 text-white h-12 text-center text-lg tracking-widest rounded-xl focus-visible:ring-primary placeholder:text-gray-600 placeholder:tracking-normal placeholder:text-sm ${
                        adminError ? "border-red-500/60 bg-red-500/5" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {adminError && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs">
                      Incorrect PIN. Access denied.
                    </motion.p>
                  )}
                </div>

                <Button
                  type="submit" disabled={isLoading}
                  className="w-full h-12 font-semibold btn-glow-red text-white rounded-xl border-0"
                >
                  {isLoading ? "Verifying…" : "Unlock Dashboard"}
                </Button>

                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex items-center gap-3">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-xs text-gray-500">
                    This area is protected. Hint: <span className="font-mono text-gray-400">{ADMIN_PIN}</span>
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  );
}
