import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Calendar,
  Droplet,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  Users,
  SlidersHorizontal,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useListDonors, getListDonorsQueryKey } from "@workspace/api-client-react";
import { format, differenceInDays } from "date-fns";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BLOOD_GROUP_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  "A+":  { bg: "bg-rose-500/15",   text: "text-rose-300",   glow: "shadow-rose-500/20" },
  "A-":  { bg: "bg-rose-600/15",   text: "text-rose-400",   glow: "shadow-rose-600/20" },
  "B+":  { bg: "bg-orange-500/15", text: "text-orange-300", glow: "shadow-orange-500/20" },
  "B-":  { bg: "bg-orange-600/15", text: "text-orange-400", glow: "shadow-orange-600/20" },
  "AB+": { bg: "bg-violet-500/15", text: "text-violet-300", glow: "shadow-violet-500/20" },
  "AB-": { bg: "bg-violet-600/15", text: "text-violet-400", glow: "shadow-violet-600/20" },
  "O+":  { bg: "bg-primary/15",    text: "text-primary",    glow: "shadow-primary/20" },
  "O-":  { bg: "bg-red-700/15",    text: "text-red-400",    glow: "shadow-red-700/20" },
};

function daysSinceDonation(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return differenceInDays(new Date(), new Date(dateStr));
}

function DonorCard({ donor, index }: { donor: ReturnType<typeof useListDonors>["data"] extends (infer T)[] | undefined ? T : never; index: number }) {
  const [contactRevealed, setContactRevealed] = useState(false);
  const colors = BLOOD_GROUP_COLORS[donor.blood_group] ?? BLOOD_GROUP_COLORS["O+"];
  const daysSince = daysSinceDonation(donor.last_donation_date);
  const canDonate = daysSince === null || daysSince >= 90;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
      layout
    >
      <GlassCard className="relative overflow-hidden group hover:border-white/20 transition-all duration-300 h-full flex flex-col">
        {/* Top accent */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] ${colors.bg.replace("/15", "/40")}`}
        />

        {/* Blood Group Badge */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-2xl border border-white/10 ${colors.bg} shadow-lg ${colors.glow} font-black text-xl ${colors.text} transition-transform duration-300 group-hover:scale-105`}
          >
            {donor.blood_group}
          </div>

          {/* Availability pill */}
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
            {donor.district}
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

          {/* Tags row */}
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

        {/* Contact Section */}
        <div className="pt-4 border-t border-white/8">
          {!contactRevealed ? (
            <Button
              variant="outline"
              className="w-full h-11 bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 rounded-xl text-sm font-medium transition-all duration-200"
              onClick={() => setContactRevealed(true)}
              disabled={!donor.is_willing_to_donate}
            >
              {donor.is_willing_to_donate ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Reveal Contact
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-2 opacity-50" />
                  Not Available
                </>
              )}
            </Button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#25D366]/20 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-mono text-emerald-300 font-medium truncate">
                      {donor.whatsapp_number}
                    </span>
                  </div>
                  <a
                    href={`https://wa.me/${donor.whatsapp_number.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 ml-2 text-xs text-[#25D366] hover:underline font-medium"
                  >
                    Open
                  </a>
                </div>
                <button
                  onClick={() => setContactRevealed(false)}
                  className="w-full text-xs text-gray-600 hover:text-gray-400 py-1 transition-colors"
                >
                  Hide contact
                </button>
              </motion.div>
            </AnimatePresence>
          )}
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

  // Fetch all donors — filter client-side for instant UX
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
            Search available donors in your area. Contact details are hidden until you reveal them — protecting donor privacy while keeping help accessible.
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <GlassCard className="mb-6 p-5 space-y-4">
            {/* Search + Availability row */}
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

              {/* Availability toggle */}
              <div className="flex items-center gap-3 px-4 h-11 bg-white/5 border border-white/10 rounded-xl shrink-0">
                <span className="text-sm text-gray-400 whitespace-nowrap">Available only</span>
                <Switch
                  checked={onlyAvailable}
                  onCheckedChange={setOnlyAvailable}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>

            {/* Blood Group Quick Pills */}
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

            {/* Active filter summary */}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Users className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No donors found</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              {hasActiveFilters
                ? "Try broadening your filters — for example, remove the blood group filter or show unavailable donors too."
                : "No donors are registered yet. Be the first!"}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearAll}
                className="border-white/10 text-gray-300 hover:bg-white/5"
              >
                <X className="w-4 h-4 mr-2" /> Clear All Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            {/* Results count */}
            {!hasActiveFilters && (
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{filtered.length} donors registered</span>
              </div>
            )}

            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
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
