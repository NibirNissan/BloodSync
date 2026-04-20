import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

/**
 * Reusable Change-Password section. Drops into any authenticated page
 * (admin dashboard, donor dashboard, user profile) — uses the shared
 * Glassmorphism look + bilingual typography (Bengali heading, English
 * action buttons & input semantics).
 */
export function ChangePasswordCard() {
  const { toast } = useToast();
  const { updatePassword } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tooShort = newPassword.length > 0 && newPassword.length < 6;
  const mismatch = confirm.length > 0 && confirm !== newPassword;
  const isValid = newPassword.length >= 6 && confirm === newPassword;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      await updatePassword(newPassword);
      toast({
        title: "Password updated",
        description: "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।",
      });
      setNewPassword("");
      setConfirm("");
    } catch (err: any) {
      toast({
        title: "Could not update password",
        description: err?.message || "অনুগ্রহ করে আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <GlassCard className="p-6 md:p-7">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">পাসওয়ার্ড পরিবর্তন</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              নিরাপদে আপনার অ্যাকাউন্টের পাসওয়ার্ড আপডেট করুন
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-gray-300 text-sm flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-gray-500" />
              নতুন পাসওয়ার্ড
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={show ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর"
                autoComplete="new-password"
                required
                className={`bg-white/5 border-white/10 text-white h-11 rounded-xl pr-10 focus-visible:ring-primary placeholder:text-gray-600 ${
                  tooShort ? "border-amber-500/50" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {tooShort && (
              <p className="text-xs text-amber-400/90 mt-1">
                পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-gray-300 text-sm flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-gray-500" />
              নিশ্চিত করুন
            </Label>
            <Input
              id="confirm-password"
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="আবার পাসওয়ার্ড লিখুন"
              autoComplete="new-password"
              required
              className={`bg-white/5 border-white/10 text-white h-11 rounded-xl focus-visible:ring-primary placeholder:text-gray-600 ${
                mismatch ? "border-red-500/50" : ""
              }`}
            />
            {mismatch && (
              <p className="text-xs text-red-400/90 mt-1">
                দুটি পাসওয়ার্ড মিলছে না।
              </p>
            )}
            {isValid && (
              <p className="text-xs text-emerald-400/90 mt-1 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> পাসওয়ার্ড মিলেছে
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!isValid || submitting}
            className={`w-full h-11 rounded-xl text-sm font-semibold border-0 transition-all ${
              isValid && !submitting
                ? "btn-glow-red text-white"
                : "bg-white/[0.04] text-gray-600 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating…
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </GlassCard>
    </motion.div>
  );
}
