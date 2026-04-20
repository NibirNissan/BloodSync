import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { User, Mail, Lock, Loader2, UserPlus } from "lucide-react";

export default function RegisterUser() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Weak password", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { user } = await signUp({ email, password, role: "normal", full_name: fullName });
      if (!user) {
        toast({
          title: "Check your email",
          description: "Confirm your email, then log in to continue.",
        });
        setLocation("/login");
        return;
      }
      toast({ title: "Account created", description: "Welcome to BloodSync!" });
      setLocation("/user-profile");
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center w-full px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 mb-6">
            <UserPlus className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Create your account
          </h1>
          <p className="text-gray-400 text-sm">
            Track the blood requests you make from one place.
          </p>
        </div>

        <GlassCard className="p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-300 text-sm flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gray-500" />
                Full Name
              </Label>
              <Input
                id="fullName" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Sara Ahmed" required minLength={2}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary placeholder:text-gray-600"
              />
            </div>
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
              <Label htmlFor="password" className="text-gray-300 text-sm flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-gray-500" />
                Password
              </Label>
              <Input
                id="password" type="password" autoComplete="new-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters" required minLength={6}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary placeholder:text-gray-600"
              />
            </div>
            <Button
              type="submit" disabled={loading}
              className="w-full h-12 font-semibold btn-glow-red text-white rounded-xl border-0"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account…</>
              ) : "Create Account"}
            </Button>
            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <a href="/login" className="text-white hover:text-primary transition-colors font-medium">
                Sign in
              </a>
            </p>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
