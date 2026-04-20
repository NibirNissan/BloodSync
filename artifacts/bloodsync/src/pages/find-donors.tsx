import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Droplet, X, Users, SlidersHorizontal,
  Droplets, Search, Sparkles, Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useListDonors, getListDonorsQueryKey,
} from "@workspace/api-client-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const DISTRICTS = [
  "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Barisal",
  "Rangpur", "Mymensingh", "Comilla", "Narayanganj", "Gazipur",
  "Tangail", "Jessore", "Bogura", "Cox's Bazar", "Jamalpur",
];

type DonorType = NonNullable<ReturnType<typeof useListDonors>["data"]>[number];

// ─── Donor Card (privacy-first, no contact info) ─────────────────────────────
function DonorCard({ donor, index }: { donor: DonorType; index: number }) {
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

  const { data: allDonors, isLoading } = useListDonors(
    {},
    { query: { queryKey: getListDonorsQueryKey({}) } }
  );

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
                <DonorCard key={donor.id} donor={donor} index={idx} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

      </div>
    </div>
  );
}
