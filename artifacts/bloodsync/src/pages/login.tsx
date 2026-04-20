import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplet, Lock, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, routeForRole } from "@/lib/auth";

/**
 * Unified login — single Supabase Email + Password form for ALL roles
 * (Super Admin, Donor, Normal User). Routing is decided after the
 * profile arrives via auth context, in the useEffect below.
 */
export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, profile, signInWithPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Smart role-based redirect. Runs once profile is loaded.
  useEffect(() => {
    if (user && profile) {
      setLocation(routeForRole(profile.role));
    }
  }, [user, profile, setLocation]);

  // Brief overlay while we wait for the profile row to resolve
  // (signInWithPassword resolves before the auth listener fires).
  const redirecting = !!user && !profile;
  if (redirecting) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center w-full px-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Signing you in…</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithPassword(email, password);
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

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center w-full px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 mb-6">
            <Droplet className="w-7 h-7 text-primary" fill="currentColor" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Login
          </h1>
          <p className="text-gray-400 text-sm">
            আপনার BloodSync অ্যাকাউন্টে সাইন ইন করুন
          </p>
        </div>

        <GlassCard className="p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                ইমেইল
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-gray-500" />
                পাসওয়ার্ড
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary placeholder:text-gray-600"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 font-semibold btn-glow-red text-white rounded-xl border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center text-sm text-gray-500 space-y-1 pt-1">
              <p>
                অ্যাকাউন্ট নেই?{" "}
                <a
                  href="/register-user"
                  className="text-white hover:text-primary transition-colors font-medium"
                >
                  Sign up as User
                </a>
              </p>
              <p>
                রক্ত দিতে চান?{" "}
                <a
                  href="/register"
                  className="text-white hover:text-primary transition-colors font-medium"
                >
                  Register as Donor
                </a>
              </p>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
