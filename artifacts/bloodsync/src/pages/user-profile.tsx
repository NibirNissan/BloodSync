import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase, type Donor } from "@/lib/supabase";
import {
  AlertCircle, Loader2, Search, Droplet, MapPin, Phone,
  Clock, CheckCircle2, User as UserIcon,
} from "lucide-react";

interface RequestRow {
  id: number;
  donor_id: number;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  fulfilled: { label: "Fulfilled", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  cancelled: { label: "Cancelled", cls: "bg-gray-500/15 text-gray-300 border-gray-500/30" },
};

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const { user, profile, loading: authLoading } = useAuth();

  // Pull all requests this user has made.
  const { data: requests, isLoading: reqLoading } = useQuery({
    queryKey: ["supabase", "my-requests", user?.id ?? "anon"],
    enabled: !!user?.id,
    queryFn: async (): Promise<RequestRow[]> => {
      const { data, error } = await supabase
        .from("requests")
        .select("id, donor_id, status, created_at")
        .eq("requester_uid", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RequestRow[];
    },
  });

  const donorIds = useMemo(
    () => Array.from(new Set((requests ?? []).map(r => r.donor_id))),
    [requests],
  );

  // Hydrate donor info for the requests we made.
  const { data: donors } = useQuery({
    queryKey: ["supabase", "my-requests-donors", donorIds.join(",")],
    enabled: donorIds.length > 0,
    queryFn: async (): Promise<Donor[]> => {
      const { data, error } = await supabase
        .from("donors")
        .select("*")
        .in("id", donorIds);
      if (error) throw error;
      return (data ?? []) as Donor[];
    },
  });

  const donorById = useMemo(() => {
    const map = new Map<number, Donor>();
    (donors ?? []).forEach(d => map.set(d.id, d));
    return map;
  }, [donors]);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/login");
  }, [authLoading, user, setLocation]);

  if (authLoading || (user && reqLoading)) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const total = requests?.length ?? 0;
  const fulfilled = (requests ?? []).filter(r => r.status === "fulfilled").length;
  const pending = (requests ?? []).filter(r => r.status === "pending").length;
  const displayName = profile?.full_name || user.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen pt-32 pb-20 w-full px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
              <UserIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Hi, {displayName}
              </h1>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Requests" value={total} icon={<Search className="w-5 h-5" />} accent="text-white" />
          <StatCard label="Fulfilled" value={fulfilled} icon={<CheckCircle2 className="w-5 h-5" />} accent="text-emerald-300" />
          <StatCard label="Pending" value={pending} icon={<Clock className="w-5 h-5" />} accent="text-amber-300" />
        </div>

        {/* Requests list */}
        <GlassCard className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">My Blood Requests</h2>
            <Button
              onClick={() => setLocation("/find-donors")}
              className="h-9 px-4 rounded-full text-sm font-semibold btn-glow-red text-white border-0"
            >
              <Search className="w-4 h-4 mr-2" />
              Find Donors
            </Button>
          </div>

          {total === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 mb-1">You haven't made any requests yet.</p>
              <p className="text-gray-500 text-sm mb-5">Search for donors to make your first request.</p>
              <Button
                onClick={() => setLocation("/find-donors")}
                className="btn-glow-red text-white border-0 rounded-xl"
              >
                Find a Donor
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {(requests ?? []).map(r => {
                const d = donorById.get(r.donor_id);
                const statusInfo = STATUS_STYLES[r.status] ?? STATUS_STYLES.pending;
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold truncate">
                          {d ? d.name : `Donor #${r.donor_id}`}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                        {d && (
                          <>
                            <span className="inline-flex items-center gap-1">
                              <Droplet className="w-3 h-3 text-primary" fill="currentColor" />
                              {d.blood_group}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {d.district}
                            </span>
                            {r.status === "fulfilled" && (
                              <span className="inline-flex items-center gap-1 text-emerald-300">
                                <Phone className="w-3 h-3" />
                                {d.whatsapp_number}
                              </span>
                            )}
                          </>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <div className={`${accent} opacity-80`}>{icon}</div>
      </div>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    </GlassCard>
  );
}
