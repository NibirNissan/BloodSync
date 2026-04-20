import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Calendar,
  Droplet,
  X,
  ShieldCheck,
  AlertTriangle,
  Users,
  SlidersHorizontal,
  Droplets,
  MessageCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  useListDonors,
  getListDonorsQueryKey,
  useCreateRequest,
} from "@workspace/api-client-react";
import { format, differenceInDays } from "date-fns";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BLOOD_GROUP_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  "A+":  { bg: "bg-rose-500/15",   text: "text-rose-300",   ring: "#f43f5e" },
  "A-":  { bg: "bg-rose-600/15",   text: "text-rose-400",   ring: "#e11d48" },
  "B+":  { bg: "bg-orange-500/15", text: "text-orange-300", ring: "#f97316" },
  "B-":  { bg: "bg-orange-600/15", text: "text-orange-400", ring: "#ea580c" },
  "AB+": { bg: "bg-violet-500/15", text: "text-violet-300", ring: "#8b5cf6" },
  "AB-": { bg: "bg-violet-600/15", text: "text-violet-400", ring: "#7c3aed" },
  "O+":  { bg: "bg-primary/15",    text: "text-primary",    ring: "#dc2626" },
  "O-":  { bg: "bg-red-700/15",    text: "text-red-400",    ring: "#b91c1c" },
};

const COUNTDOWN_SECONDS = 15;
const RING_RADIUS = 24;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function getOrCreateRequesterId(): string {
  const key = "bloodsync_requester_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `req_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function CountdownRing({
  secondsLeft,
  total,
  color,
}: {
  secondsLeft: number;
  total: number;
  color: string;
}) {
  const progress = secondsLeft / total;
  const offset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <svg width={64} height={64} viewBox="0 0 64 64" className="-rotate-90">
      {/* Track */}
      <circle
        cx="32"
        cy="32"
        r={RING_RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="4"
      />
      {/* Progress */}
      <circle
        cx="32"
        cy="32"
        r={RING_RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
    </svg>
  );
}

type ContactPhase = "idle" | "counting" | "revealed";

type DonorType = NonNullable<ReturnType<typeof useListDonors>["data"]>[number];

function DonorCard({ donor, index }: { donor: DonorType; index: number }) {
  const [phase, setPhase] = useState<ContactPhase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const colors = BLOOD_GROUP_COLORS[donor.blood_group] ?? BLOOD_GROUP_COLORS["O+"];

  const daysSince = donor.last_donation_date
    ? differenceInDays(new Date(), new Date(donor.last_donation_date))
    : null;
  const canDonate = daysSince === null || daysSince >= 90;

  const { mutate: createRequest } = useCreateRequest();

  const startRequest = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("counting");
    setSecondsLeft(COUNTDOWN_SECONDS);

    // Fire the background API call immediately
    createRequest({
      data: {
        donor_id: donor.id,
        requester_identifier: getOrCreateRequesterId(),
      },
    });

    // Countdown
    let remaining = COUNTDOWN_SECONDS;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        setPhase("revealed");
      }
    }, 1000);
  }, [phase, donor.id, createRequest]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const waNumber = donor.whatsapp_number.replace(/[^0-9]/g, "");
  const waMessage = encodeURIComponent(
    `Hello ${donor.name}, I urgently need ${donor.blood_group} blood. I found your profile on BloodSync. Could you please help me? Thank you.`
  );
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
      layout
    >
      <GlassCard className="relative overflow-hidden group hover:border-white/20 transition-all duration-300 h-full flex flex-col">
        {/* Top color accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-50"
          style={{ background: colors.ring }}
        />

        {/* Blood Group + Availability */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-2xl border border-white/10 ${colors.bg} font-black text-xl ${colors.text} transition-transform duration-300 group-hover:scale-105`}
          >
            {donor.blood_group}
          </div>

          {donor.is_willing_to_donate ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Available
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
              Unavailable
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-lg font-bold text-white mb-1 leading-tight">{donor.name}</h3>

        {/* Info rows */}
        <div className="space-y-2 mb-4 flex-1">
          <div className="flex items-center text-sm text-gray-400">
            <MapPin className="w-3.5 h-3.5 mr-2 text-gray-600 shrink-0" />
            {phase === "revealed" ? (
              <span className="text-white font-medium">{donor.district}</span>
            ) : (
              <span>{donor.district}</span>
            )}
          </div>

          <div className="flex items-center text-sm">
            <Calendar className="w-3.5 h-3.5 mr-2 text-gray-600 shrink-0" />
            {donor.last_donation_date ? (
              <span className={canDonate ? "text-emerald-400" : "text-amber-400"}>
                {canDonate ? "Eligible" : "Wait"} · {format(new Date(donor.last_donation_date), "MMM yyyy")}
              </span>
            ) : (
              <span className="text-gray-500">No prior donation</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            {donor.smoker && (
              <span className="flex items-center gap-1 text-xs text-orange-400/80 bg-orange-500/10 border border-orange-500/15 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                Smoker
              </span>
            )}
            {donor.successful_donations > 0 && (
              <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/15 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                {donor.successful_donations} verified
              </span>
            )}
          </div>
        </div>

        {/* ── Contact section ── */}
        <div className="pt-4 border-t border-white/8">
          <AnimatePresence mode="wait">

            {/* PHASE: idle */}
            {phase === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  className="w-full h-11 rounded-xl font-medium text-sm transition-all duration-200"
                  style={
                    donor.is_willing_to_donate
                      ? { background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }
                      : {}
                  }
                  variant={donor.is_willing_to_donate ? "ghost" : "outline"}
                  disabled={!donor.is_willing_to_donate}
                  onClick={startRequest}
                >
                  {donor.is_willing_to_donate ? (
                    <>
                      <Droplets className="w-4 h-4 mr-2" />
                      Request for Blood
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2 opacity-40" />
                      Not Available
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* PHASE: counting */}
            {phase === "counting" && (
              <motion.div
                key="counting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-3 py-2"
              >
                {/* Circular countdown */}
                <div className="relative flex items-center justify-center">
                  <CountdownRing
                    secondsLeft={secondsLeft}
                    total={COUNTDOWN_SECONDS}
                    color={colors.ring}
                  />
                  <span
                    className={`absolute text-xl font-black tabular-nums ${colors.text}`}
                  >
                    {secondsLeft}
                  </span>
                </div>

                <div className="text-center space-y-0.5">
                  <p className="text-sm font-semibold text-white">Notifying donor...</p>
                  <p className="text-xs text-gray-500">Contact details will be revealed shortly</p>
                </div>

                {/* Animated dots */}
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gray-600"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* PHASE: revealed */}
            {phase === "revealed" && (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Success header */}
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Contact Unlocked</span>
                </div>

                {/* WhatsApp number row */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/8 border border-emerald-500/25 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-[#25D366]/20 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">WhatsApp</p>
                    <p className="text-sm font-mono text-emerald-300 font-semibold truncate">
                      {donor.whatsapp_number}
                    </p>
                  </div>
                </div>

                {/* Location detail */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white/4 border border-white/8 rounded-xl">
                  <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Location</p>
                    <p className="text-sm text-white font-medium">{donor.district}</p>
                  </div>
                </div>

                {/* WhatsApp CTA */}
                <a href={waLink} target="_blank" rel="noreferrer" className="block">
                  <Button className="w-full h-11 rounded-xl font-semibold text-sm bg-[#25D366] hover:bg-[#20ba59] text-white border-0 transition-all duration-200">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send WhatsApp Message
                  </Button>
                </a>

                <button
                  onClick={() => setPhase("idle")}
                  className="w-full text-xs text-gray-600 hover:text-gray-400 py-1 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function FindDonors() {
  const [searchText, setSearchText] = useState("");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>("");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: allDonors, isLoading } = useListDonors(
    {},
    { query: { queryKey: getListDonorsQueryKey({}) } }
  );

  const filtered = useMemo(() => {
    if (!allDonors) return [];
    return allDonors.filter((d) => {
      if (selectedBloodGroup && d.blood_group !== selectedBloodGroup) return false;
      if (onlyAvailable && !d.is_willing_to_donate) return false;
      if (searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        if (!d.district.toLowerCase().includes(q) && !d.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allDonors, selectedBloodGroup, onlyAvailable, searchText]);

  const hasActiveFilters = !!selectedBloodGroup || !onlyAvailable || !!searchText.trim();

  const clearAll = () => {
    setSearchText("");
    setSelectedBloodGroup("");
    setOnlyAvailable(true);
    searchRef.current?.focus();
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-6">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-xs text-primary uppercase tracking-widest font-semibold mb-2">No login required</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Find Blood Donors</h1>
          <p className="text-gray-400 max-w-2xl">
            Search available donors in your area. Contact details are revealed after a short notification delay — protecting privacy while keeping help within reach.
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <GlassCard className="mb-6 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <Input
                  ref={searchRef}
                  placeholder="Search by name or district..."
                  className="pl-10 bg-white/5 border-white/10 text-white h-11 rounded-xl focus-visible:ring-primary placeholder:text-gray-600"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 px-4 h-11 bg-white/5 border border-white/10 rounded-xl shrink-0">
                <span className="text-sm text-gray-400 whitespace-nowrap">Available only</span>
                <Switch
                  checked={onlyAvailable}
                  onCheckedChange={setOnlyAvailable}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>

            {/* Blood Group Pills */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium flex items-center gap-1.5">
                <Droplet className="w-3 h-3" /> Blood Group
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedBloodGroup("")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                    !selectedBloodGroup
                      ? "bg-white/15 border-white/30 text-white"
                      : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20"
                  }`}
                >
                  All
                </button>
                {BLOOD_GROUPS.map((bg) => {
                  const colors = BLOOD_GROUP_COLORS[bg];
                  const isSelected = selectedBloodGroup === bg;
                  return (
                    <button
                      key={bg}
                      onClick={() => setSelectedBloodGroup(isSelected ? "" : bg)}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all duration-150 ${
                        isSelected
                          ? `${colors.bg} ${colors.text} border-current`
                          : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20"
                      }`}
                    >
                      {bg}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter summary */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-white/8">
                <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-600" />
                  Showing
                  <span className="text-white font-semibold">{filtered.length}</span>
                  of
                  <span className="text-white font-semibold">{allDonors?.length ?? 0}</span>
                  donors
                  {selectedBloodGroup && (
                    <Badge className="bg-primary/15 text-primary border-primary/25 text-xs px-2 py-0.5">
                      {selectedBloodGroup}
                    </Badge>
                  )}
                  {onlyAvailable && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs px-2 py-0.5">
                      Available
                    </Badge>
                  )}
                </div>
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-500 hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" /> Reset
                </button>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Users className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No donors found</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              {hasActiveFilters
                ? "Try broadening your filters — remove the blood group filter or show unavailable donors too."
                : "No donors are registered yet. Be the first!"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearAll} className="border-white/10 text-gray-300 hover:bg-white/5">
                <X className="w-4 h-4 mr-2" /> Clear All Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            {!hasActiveFilters && (
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{filtered.length} donors registered</span>
              </div>
            )}
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((donor, idx) => (
                  <DonorCard key={donor.id} donor={donor} index={idx} />
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
