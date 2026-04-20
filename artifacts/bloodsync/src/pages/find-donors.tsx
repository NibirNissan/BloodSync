import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Droplet, X, Users, SlidersHorizontal,
  Droplets, Search, Sparkles, Heart, ShieldCheck, MessageCircle,
  CheckCircle2, Loader2, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Donor } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const DONORS_QUERY_KEY = ["supabase", "donors"] as const;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const DISTRICTS = [
  "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Barisal",
  "Rangpur", "Mymensingh", "Comilla", "Narayanganj", "Gazipur",
  "Tangail", "Jessore", "Bogura", "Cox's Bazar", "Jamalpur",
];

type DonorType = Donor;

const COUNTDOWN_TOTAL = 10; // seconds — exact reveal timing per spec
const RING_RADIUS = 70;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── Request Modal: countdown → reveal contact ───────────────────────────────
// Reveal is gated on BOTH (1) successful request creation and (2) countdown completion.
type RequestPhase = "counting" | "revealed" | "error";

function RequestModal({ donor, requesterUid, onClose }: { donor: DonorType; requesterUid: string; onClose: () => void }) {
  const [phase, setPhase] = useState<RequestPhase>("counting");
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_TOTAL);
  const requestSucceededRef = useRef(false);
  const countdownDoneRef = useRef(false);
  const erroredRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();
  const { mutate: createRequest } = useMutation({
    mutationFn: async (vars: { donor_id: number; requester_uid: string }) => {
      const { data, error } = await supabase
        .from("requests")
        .insert({
          donor_id: vars.donor_id,
          requester_identifier: vars.requester_uid,
          requester_uid: vars.requester_uid,
        })
        .select()
        .single();
      if (error) throw error;

      // Increment the donor's total_requests_received counter (best-effort).
      const { data: donorRow } = await supabase
        .from("donors")
        .select("total_requests_received")
        .eq("id", vars.donor_id)
        .single();
      if (donorRow) {
        await supabase
          .from("donors")
          .update({ total_requests_received: (donorRow.total_requests_received ?? 0) + 1 })
          .eq("id", vars.donor_id);
      }
      return data;
    },
  });

  // Try to reveal — only when both gates pass and no error occurred
  const tryReveal = useCallback(() => {
    if (erroredRef.current) return;
    if (requestSucceededRef.current && countdownDoneRef.current) {
      setPhase("revealed");
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start countdown FIRST so we can abort it from any error path,
  // then fire the mutation. The timer tick is a no-op once errored.
  useEffect(() => {
    let remaining = COUNTDOWN_TOTAL;
    intervalRef.current = setInterval(() => {
      if (erroredRef.current) { stopTimer(); return; }
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        stopTimer();
        countdownDoneRef.current = true;
        tryReveal();
      }
    }, 1000);

    createRequest(
      {
        donor_id: donor.id,
        requester_uid: requesterUid,
      },
      {
        onSuccess: () => {
          if (erroredRef.current) return;
          requestSucceededRef.current = true;
          queryClient.invalidateQueries({ queryKey: DONORS_QUERY_KEY });
          tryReveal();
        },
        onError: () => {
          erroredRef.current = true;
          stopTimer();
          setPhase("error");
        },
      }
    );

    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donor.id]);

  // Build pre-filled WhatsApp message — multiline, properly URL-encoded
  const buildWhatsAppLink = useCallback(() => {
    const lines = [
      `Hello ${donor.name},`,
      ``,
      `I urgently need ${donor.blood_group} blood and found your profile on BloodSync.`,
      ``,
      `Could you please help? Any guidance on availability and how to coordinate would mean a lot.`,
      ``,
      `Thank you for being a donor — you save lives.`,
    ];
    // Join with real newlines, then encodeURIComponent converts \n → %0A
    const message = encodeURIComponent(lines.join("\n"));
    const phoneDigits = donor.whatsapp_number.replace(/\D/g, "");
    return `https://wa.me/${phoneDigits}?text=${message}`;
  }, [donor.name, donor.blood_group, donor.whatsapp_number]);

  const elapsed = COUNTDOWN_TOTAL - secondsLeft;
  const progress = elapsed / COUNTDOWN_TOTAL;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={phase === "revealed" ? onClose : undefined}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
        className="relative w-full max-w-md"
      >
        <div className="relative bg-white/[0.05] backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Ambient red glow background */}
          <div className="absolute -top-32 -right-32 w-72 h-72 bg-primary/15 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Close button (available after reveal or on error) */}
          {(phase === "revealed" || phase === "error") && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Donor Header */}
          <div className="relative flex items-center gap-4 mb-8">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/40 blur-xl rounded-2xl" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/40 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                <span
                  className="text-xl font-black text-white"
                  style={{ textShadow: "0 0 12px rgba(239,68,68,0.8)" }}
                >
                  {donor.blood_group}
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-white truncate">{donor.name}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mt-0.5">Blood Donor</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* PHASE: COUNTING */}
            {phase === "counting" && (
              <motion.div
                key="counting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative flex flex-col items-center"
              >
                {/* Glowing Ring Timer */}
                <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                  {/* Outer pulsing glow */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {/* SVG Ring */}
                  <svg width="176" height="176" viewBox="0 0 176 176" className="-rotate-90 relative">
                    <defs>
                      <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fca5a5" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                      <filter id="ring-glow">
                        <feGaussianBlur stdDeviation="3" result="b" />
                        <feMerge>
                          <feMergeNode in="b" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    {/* Track */}
                    <circle cx="88" cy="88" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    {/* Progress */}
                    <circle
                      cx="88" cy="88" r={RING_RADIUS}
                      fill="none"
                      stroke="url(#ring-gradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={dashOffset}
                      filter="url(#ring-glow)"
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>

                  {/* Number in center */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      key={secondsLeft}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      className="text-5xl font-black text-white tabular-nums"
                      style={{ textShadow: "0 0 20px rgba(239,68,68,0.7)" }}
                    >
                      {secondsLeft}
                    </motion.span>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mt-1">seconds</span>
                  </div>
                </div>

                {/* Status text */}
                <div className="text-center space-y-2 max-w-xs">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Bell className="w-4 h-4 animate-pulse" />
                    <p className="text-sm font-semibold">Notifying donor...</p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Contact details will reveal once the donor receives your alert. This protects their privacy from spam.
                  </p>

                  {/* Animated dots */}
                  <div className="flex items-center justify-center gap-1.5 pt-2">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary/60"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* PHASE: ERROR */}
            {phase === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="relative flex flex-col items-center text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5">
                  <X className="w-8 h-8 text-amber-400" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Request couldn't be sent</h4>
                <p className="text-sm text-gray-400 max-w-xs mb-6">
                  We couldn't notify the donor right now. Their contact stays protected — please try again in a moment.
                </p>
                <Button
                  onClick={onClose}
                  className="bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-xl px-6"
                >
                  Close
                </Button>
              </motion.div>
            )}

            {/* PHASE: REVEALED */}
            {phase === "revealed" && (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative space-y-5"
              >
                {/* Success header */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", bounce: 0.5 }}
                  className="flex items-center justify-center gap-2 mb-2"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-sm font-bold text-emerald-300 uppercase tracking-[0.2em]">Contact Unlocked</span>
                </motion.div>

                {/* WhatsApp Number */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#25D366]/15 border border-[#25D366]/25 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-0.5">WhatsApp</p>
                    <p className="text-base font-mono font-semibold text-white truncate">
                      {donor.whatsapp_number}
                    </p>
                  </div>
                </motion.div>

                {/* Exact Location */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-0.5">Exact Location</p>
                    <p className="text-base font-semibold text-white truncate">{donor.district}</p>
                  </div>
                </motion.div>

                {/* Connect on WhatsApp button — vibrant green glow */}
                <motion.a
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  href={buildWhatsAppLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="block group"
                >
                  <Button className="w-full h-13 py-3.5 rounded-2xl text-base font-semibold border-0 text-white relative overflow-hidden bg-[#25D366] hover:bg-[#1ebe58] shadow-[0_0_30px_rgba(37,211,102,0.5)] hover:shadow-[0_0_40px_rgba(37,211,102,0.7)] transition-all duration-300">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Connect on WhatsApp
                  </Button>
                </motion.a>

                {/* Privacy footer */}
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                  className="text-center text-xs text-gray-600 flex items-center justify-center gap-1.5 pt-1"
                >
                  <ShieldCheck className="w-3 h-3" />
                  Please be respectful — only contact for genuine emergencies.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Donor Card (privacy-first, no contact info) ─────────────────────────────
function DonorCard({ donor, index, onRequest }: { donor: DonorType; index: number; onRequest: (d: DonorType) => void }) {
  const isAvailable = donor.is_willing_to_donate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
      layout
      className="group relative"
    >
      {/* Ambient red glow on hover */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/8 blur-2xl rounded-3xl transition-all duration-500 pointer-events-none" />

      <div className="relative bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full flex flex-col hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">

        {/* Top row — Status + Blood group glowing badge */}
        <div className="flex items-start justify-between mb-5">
          {/* Glowing red blood group badge */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/40 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.35)]">
              <span
                className="text-xl font-black text-white tabular-nums"
                style={{ textShadow: "0 0 12px rgba(239,68,68,0.7)" }}
              >
                {donor.blood_group}
              </span>
            </div>
          </div>

          {/* Status dot */}
          {isAvailable ? (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-full">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-400" />
              </span>
              Active
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              Unavailable
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="text-lg font-bold text-white mb-2 leading-tight tracking-tight">
          {donor.name}
        </h3>

        {/* District */}
        <div className="flex items-center text-sm text-gray-400 mb-5">
          <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-500 shrink-0" />
          {donor.district}
        </div>

        {/* Spacer push button down */}
        <div className="flex-1" />

        {/* Request for Blood button (no contact yet — privacy first) */}
        <Button
          disabled={!isAvailable}
          onClick={() => isAvailable && onRequest(donor)}
          className={`w-full h-11 rounded-xl text-sm font-semibold border transition-all duration-200 ${
            isAvailable
              ? "bg-white/[0.05] border-primary/30 text-primary hover:bg-primary/15 hover:border-primary/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.25)]"
              : "bg-white/[0.03] border-white/10 text-gray-600 cursor-not-allowed"
          }`}
        >
          {isAvailable ? (
            <>
              <Droplets className="w-4 h-4 mr-2" />
              Request for Blood
            </>
          ) : (
            <>
              <X className="w-4 h-4 mr-2 opacity-40" />
              Not Available
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Find Donors Page ───────────────────────────────────────────────────
export default function FindDonors() {
  const [bloodGroup, setBloodGroup] = useState<string>("all");
  const [district, setDistrict] = useState<string>("all");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [activeDonor, setActiveDonor] = useState<DonorType | null>(null);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const requestDonor = (donor: DonorType) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please log in to request a donor's contact details.",
      });
      setLocation("/login");
      return;
    }
    setActiveDonor(donor);
  };

  const { data: allDonors, isLoading } = useQuery({
    queryKey: DONORS_QUERY_KEY,
    queryFn: async (): Promise<DonorType[]> => {
      const { data, error } = await supabase
        .from("donors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DonorType[];
    },
  });

  const filtered = useMemo(() => {
    if (!allDonors) return [];
    return allDonors.filter((d) => {
      if (bloodGroup !== "all" && d.blood_group !== bloodGroup) return false;
      if (district !== "all" && d.district !== district) return false;
      if (onlyAvailable && !d.is_willing_to_donate) return false;
      return true;
    });
  }, [allDonors, bloodGroup, district, onlyAvailable]);

  const hasActiveFilters = bloodGroup !== "all" || district !== "all" || !onlyAvailable;

  const clearAll = () => {
    setBloodGroup("all");
    setDistrict("all");
    setOnlyAvailable(true);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 w-full px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            No login required
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">
            Find <span className="glow-red-text">Blood Donors</span>
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Search verified donors in your area. Their privacy is protected — contact details stay hidden until you send a request.
          </p>
        </motion.div>

        {/* ─── Sticky Filter Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="sticky top-24 z-30 mb-8"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">

            {/* Filter row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Blood Group */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-[0.18em] font-medium flex items-center gap-1.5">
                  <Droplet className="w-3 h-3 text-primary" fill="currentColor" />
                  Blood Group
                </label>
                <Select value={bloodGroup} onValueChange={setBloodGroup}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-primary">
                    <SelectValue placeholder="Any blood group" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white">
                    <SelectItem value="all">
                      <span className="text-gray-400">Any blood group</span>
                    </SelectItem>
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        <span className="font-bold text-primary mr-2">{bg}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location / District */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-[0.18em] font-medium flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-gray-500" />
                  Location
                </label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-primary">
                    <SelectValue placeholder="All districts" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white max-h-72">
                    <SelectItem value="all">
                      <span className="text-gray-400">All districts</span>
                    </SelectItem>
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Availability Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 uppercase tracking-[0.18em] font-medium flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-emerald-500" fill="currentColor" />
                  Availability
                </label>
                <div className={`flex items-center justify-between gap-3 px-4 h-12 rounded-xl border transition-all ${
                  onlyAvailable
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-white/5 border-white/10"
                }`}>
                  <span className={`text-sm font-medium ${onlyAvailable ? "text-emerald-300" : "text-gray-400"}`}>
                    Willing to Donate Only
                  </span>
                  <Switch
                    checked={onlyAvailable}
                    onCheckedChange={setOnlyAvailable}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Result summary + reset */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-4 mt-4 border-t border-white/8">
              <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-600" />
                <span>
                  Showing <span className="text-white font-semibold">{filtered.length}</span> of <span className="text-white font-semibold">{allDonors?.length ?? 0}</span> donors
                </span>
                {bloodGroup !== "all" && (
                  <span className="inline-flex items-center text-xs text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full font-semibold">
                    {bloodGroup}
                  </span>
                )}
                {district !== "all" && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-300 bg-white/5 border border-white/15 px-2 py-0.5 rounded-full">
                    <MapPin className="w-2.5 h-2.5" /> {district}
                  </span>
                )}
                {onlyAvailable && (
                  <span className="inline-flex items-center text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Available
                  </span>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-500 hover:text-primary flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-3 h-3" /> Reset filters
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── Results Grid ─── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-56 rounded-3xl animate-pulse bg-white/[0.03] border border-white/[0.07]"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              {hasActiveFilters
                ? <Search className="w-7 h-7 text-gray-600" />
                : <Users className="w-7 h-7 text-gray-600" />}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No donors found</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              {hasActiveFilters
                ? "Try broadening your filters — change the blood group or include unavailable donors."
                : "No donors are registered yet. Be the first to join!"}
            </p>
            {hasActiveFilters && (
              <Button
                onClick={clearAll}
                className="bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 rounded-xl"
              >
                <X className="w-4 h-4 mr-2" /> Clear All Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((donor, idx) => (
                <DonorCard
                  key={donor.id}
                  donor={donor}
                  index={idx}
                  onRequest={requestDonor}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

      </div>

      {/* Request Modal */}
      <AnimatePresence>
        {activeDonor && user && (
          <RequestModal
            donor={activeDonor}
            requesterUid={user.id}
            onClose={() => setActiveDonor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
