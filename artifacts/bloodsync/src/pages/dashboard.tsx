import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetStatsSummary, getGetStatsSummaryQueryKey,
  useGetBloodGroupStats, getGetBloodGroupStatsQueryKey,
  useListDonors, getListDonorsQueryKey,
  useCreateDonor,
  useUpdateDonor,
  useDeleteDonor,
  useListVerifications, getListVerificationsQueryKey,
  useUpdateVerification,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Droplet, ShieldCheck, Activity, AlertCircle, Clock, CheckCircle2,
  Lock, Eye, EyeOff, LayoutDashboard, UserCog, ClipboardList,
  Plus, Pencil, Trash2, X, ChevronDown, Search, Building2,
  Phone, MapPin, Calendar, TrendingUp, LogOut, Loader2,
  ThumbsUp, ThumbsDown, FileImage,
} from "lucide-react";
import { format } from "date-fns";

const ADMIN_PIN = "admin1234";
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const DISTRICTS = ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Barisal", "Rangpur", "Mymensingh", "Comilla", "Narayanganj", "Gazipur", "Other"];

type Tab = "overview" | "donors" | "verifications";

// ─── Password Gate ───────────────────────────────────────────────────────────
function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(false);

  const submit = () => {
    if (pin === ADMIN_PIN) { onUnlock(); }
    else { setError(true); setTimeout(() => setError(false), 1200); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Admin Access</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your admin PIN to continue</p>

          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showPin ? "text" : "password"}
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className={`h-12 text-center text-lg tracking-widest bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-primary transition-colors ${error ? "border-red-500/60 bg-red-500/5" : ""}`}
              />
              <button
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-red-400 text-sm"
              >
                Incorrect PIN. Try again.
              </motion.p>
            )}

            <Button
              onClick={submit}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold"
            >
              Unlock Dashboard
            </Button>

            <p className="text-xs text-gray-600">
              Hint: <span className="font-mono text-gray-500">{ADMIN_PIN}</span>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ─── Add / Edit Donor Modal ───────────────────────────────────────────────────
type DonorRecord = NonNullable<ReturnType<typeof useListDonors>["data"]>[number];

function DonorFormModal({
  donor,
  onClose,
  onSuccess,
}: {
  donor?: DonorRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!donor;
  const [name, setName] = useState(donor?.name ?? "");
  const [bloodGroup, setBloodGroup] = useState(donor?.blood_group ?? "");
  const [district, setDistrict] = useState(donor?.district ?? "");
  const [whatsapp, setWhatsapp] = useState(donor?.whatsapp_number ?? "");
  const [smoker, setSmoker] = useState(donor?.smoker ?? false);
  const [willing, setWilling] = useState(donor?.is_willing_to_donate ?? true);
  const [lastDonation, setLastDonation] = useState(
    donor?.last_donation_date ? donor.last_donation_date.split("T")[0] : ""
  );
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const { mutate: createDonor } = useCreateDonor();
  const { mutate: updateDonor } = useUpdateDonor();

  const isValid = name.trim() && bloodGroup && district.trim() && whatsapp.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    setSubmitting(true);
    const base = {
      name: name.trim(),
      blood_group: bloodGroup,
      district: district.trim(),
      whatsapp_number: whatsapp.trim(),
      smoker,
      is_willing_to_donate: willing,
      last_donation_date: lastDonation || null,
    };
    if (isEdit && donor) {
      updateDonor(
        { id: donor.id, data: base },
        {
          onSuccess: () => { toast({ title: "Donor updated" }); onSuccess(); },
          onError: () => { toast({ title: "Update failed", variant: "destructive" }); setSubmitting(false); },
        }
      );
    } else {
      createDonor(
        { data: base },
        {
          onSuccess: () => { toast({ title: "Donor added" }); onSuccess(); },
          onError: () => { toast({ title: "Create failed", variant: "destructive" }); setSubmitting(false); },
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg"
      >
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">{isEdit ? "Edit Donor" : "Add Donor Manually"}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-gray-400">Full Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Islam" className="bg-white/5 border-white/10 text-white h-10 rounded-xl focus-visible:ring-primary placeholder:text-gray-600" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Blood Group *</Label>
              <Select value={bloodGroup} onValueChange={setBloodGroup}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 rounded-xl">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  {BLOOD_GROUPS.map(bg => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">District *</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 rounded-xl">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  {DISTRICTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> WhatsApp Number *</Label>
              <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+880 1712-345678" className="bg-white/5 border-white/10 text-white h-10 rounded-xl focus-visible:ring-primary placeholder:text-gray-600" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Last Donation Date</Label>
              <Input type="date" value={lastDonation} onChange={e => setLastDonation(e.target.value)} className="bg-white/5 border-white/10 text-white h-10 rounded-xl focus-visible:ring-primary [color-scheme:dark]" />
            </div>

            <div className="space-y-3 flex flex-col justify-end pb-0.5">
              <div className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-xs text-gray-400">Smoker</span>
                <Switch checked={smoker} onCheckedChange={setSmoker} className="scale-90" />
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-xs text-gray-400">Willing</span>
                <Switch checked={willing} onCheckedChange={setWilling} className="scale-90 data-[state=checked]:bg-emerald-500" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-xl border-white/10 text-gray-400 hover:bg-white/5">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-white disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Save Changes" : "Add Donor"}
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ name, onConfirm, onCancel, busy }: { name: string; onConfirm: () => void; onCancel: () => void; busy: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full max-w-sm">
        <GlassCard className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Delete Donor?</h3>
          <p className="text-sm text-gray-400 mb-5">
            This will permanently remove <span className="text-white font-medium">{name}</span> and all their associated requests and verifications.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1 h-10 rounded-xl border-white/10 text-gray-400 hover:bg-white/5">Cancel</Button>
            <Button onClick={onConfirm} disabled={busy} className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white border-0">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary({ query: { queryKey: getGetStatsSummaryQueryKey() } });
  const { data: bgStats } = useGetBloodGroupStats({ query: { queryKey: getGetBloodGroupStatsQueryKey() } });

  const statCards = [
    { label: "Total Donors", value: stats?.total_donors, sub: `${stats?.willing_donors ?? "-"} actively willing`, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Total Requests", value: stats?.total_requests, sub: "Emergency contacts made", icon: AlertCircle, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Verified Donations", value: stats?.completed_donations, sub: "Confirmed life-saving acts", icon: Droplet, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending Verifications", value: stats?.pending_verifications, sub: "Require admin review", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassCard className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{card.label}</p>
                  <p className="text-3xl font-black text-white">
                    {statsLoading ? <span className="text-gray-700">—</span> : card.value}
                  </p>
                </div>
                <div className={`w-9 h-9 rounded-full ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
                </div>
              </div>
              <p className={`text-xs ${card.color} opacity-80`}>{card.sub}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Blood Group Breakdown */}
      <GlassCard className="p-6">
        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <Droplet className="w-4 h-4 text-primary" />
          Donor Distribution by Blood Group
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {bgStats?.map((stat) => {
            const pct = stats?.total_donors ? (stat.count / stats.total_donors) * 100 : 0;
            return (
              <div key={stat.blood_group} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-white">{stat.blood_group}</span>
                  <span className="text-gray-500 text-xs">{stat.count}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full">
                  <div className="h-full bg-gradient-to-r from-red-700 to-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-600">{pct.toFixed(0)}% of total</p>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* System status */}
      <GlassCard className="p-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <p className="text-sm text-gray-400">All systems operational</p>
        <span className="ml-auto text-xs text-gray-600">{format(new Date(), "PPp")}</span>
      </GlassCard>
    </div>
  );
}

// ─── Donors Tab ───────────────────────────────────────────────────────────────
function DonorsTab() {
  const { data: donors, isLoading } = useListDonors(undefined, { query: { queryKey: getListDonorsQueryKey() } });
  const { mutate: deleteDonor } = useDeleteDonor();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editDonor, setEditDonor] = useState<DonorRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!donors) return [];
    if (!search.trim()) return donors;
    const q = search.toLowerCase();
    return donors.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.district.toLowerCase().includes(q) ||
      d.blood_group.toLowerCase().includes(q)
    );
  }, [donors, search]);

  const deletingDonor = donors?.find(d => d.id === deletingId);

  const confirmDelete = () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    deleteDonor({ id: deletingId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDonorsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        toast({ title: "Donor deleted" });
        setDeletingId(null);
        setDeleteLoading(false);
      },
      onError: () => {
        toast({ title: "Delete failed", variant: "destructive" });
        setDeleteLoading(false);
      },
    });
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getListDonorsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
    setAddOpen(false);
    setEditDonor(null);
  };

  return (
    <>
      <AnimatePresence>
        {(addOpen || editDonor) && (
          <DonorFormModal
            key="modal"
            donor={editDonor}
            onClose={() => { setAddOpen(false); setEditDonor(null); }}
            onSuccess={handleModalSuccess}
          />
        )}
        {deletingId && (
          <DeleteConfirm
            key="delete"
            name={deletingDonor?.name ?? ""}
            onConfirm={confirmDelete}
            onCancel={() => setDeletingId(null)}
            busy={deleteLoading}
          />
        )}
      </AnimatePresence>

      <GlassCard className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <Input
              placeholder="Search by name, district, or blood group..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white h-10 rounded-xl focus-visible:ring-primary placeholder:text-gray-600"
            />
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Donor
          </Button>
        </div>

        <p className="text-xs text-gray-500 mb-3">{filtered.length} donor{filtered.length !== 1 ? "s" : ""} found</p>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/8">
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Donor</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Blood</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">District</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">WhatsApp</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium text-center">Status</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium text-center">Req</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium text-center">Verified</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500 text-sm">
                    {search ? "No donors match your search." : "No donors registered yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((donor) => (
                  <tr key={donor.id} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{donor.name}</p>
                      <p className="text-xs text-gray-600">{format(new Date(donor.created_at), "MMM d, yyyy")}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                        {donor.blood_group}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{donor.district}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{donor.whatsapp_number}</td>
                    <td className="px-4 py-3 text-center">
                      {donor.is_willing_to_donate ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          Off
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">{donor.total_requests_received}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold ${donor.successful_donations > 0 ? "text-primary" : "text-gray-600"}`}>
                        {donor.successful_donations}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditDonor(donor)}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(donor.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/5 hover:bg-red-500/15 border border-red-500/15 flex items-center justify-center text-red-500 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}

// ─── Verification Queue Tab ───────────────────────────────────────────────────
type VerifRecord = NonNullable<ReturnType<typeof useListVerifications>["data"]>[number];

function VerificationsTab() {
  const { data: verifications, isLoading } = useListVerifications({ query: { queryKey: getListVerificationsQueryKey() } });
  const { data: donors } = useListDonors(undefined, { query: { queryKey: getListDonorsQueryKey() } });
  const { mutate: updateVerification } = useUpdateVerification();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [proofModal, setProofModal] = useState<string | null>(null);

  const donorMap = useMemo(() => {
    const map: Record<number, string> = {};
    donors?.forEach(d => { map[d.id] = d.name; });
    return map;
  }, [donors]);

  const filtered = useMemo(() => {
    if (!verifications) return [];
    if (filter === "all") return verifications;
    return verifications.filter(v => v.verification_status === filter);
  }, [verifications, filter]);

  const handleAction = (v: VerifRecord, status: "verified" | "rejected") => {
    setActionLoading(v.id);
    updateVerification(
      { id: v.id, data: { verification_status: status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVerificationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListDonorsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
          toast({ title: status === "verified" ? "Verification approved — donor count incremented" : "Verification rejected" });
          setActionLoading(null);
        },
        onError: () => { toast({ title: "Action failed", variant: "destructive" }); setActionLoading(null); },
      }
    );
  };

  const counts = {
    all: verifications?.length ?? 0,
    pending: verifications?.filter(v => v.verification_status === "pending").length ?? 0,
    verified: verifications?.filter(v => v.verification_status === "verified").length ?? 0,
    rejected: verifications?.filter(v => v.verification_status === "rejected").length ?? 0,
  };

  return (
    <>
      {/* Proof Image Modal */}
      <AnimatePresence>
        {proofModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setProofModal(null)}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <img src={proofModal} alt="Proof document" className="w-full rounded-xl border border-white/10 shadow-2xl" />
              <button onClick={() => setProofModal(null)} className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GlassCard className="p-6">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {(["pending", "all", "verified", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 capitalize ${
                filter === f
                  ? f === "pending" ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    : f === "verified" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : f === "rejected" ? "bg-red-500/15 text-red-300 border-red-500/30"
                    : "bg-white/15 text-white border-white/25"
                  : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
              }`}
            >
              {f} <span className="ml-1 opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/8">
          <table className="w-full text-sm text-left min-w-[720px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Donor</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Recipient</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Hospital</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Proof</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Submitted</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium text-center">Status</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-sm">
                    No {filter === "all" ? "" : filter} verifications found.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  let details: { name?: string; hospital?: string; contact?: string } = {};
                  try { details = JSON.parse(v.recipient_details); } catch { details = { name: v.recipient_details }; }
                  const donorName = donorMap[v.donor_id] ?? `Donor #${v.donor_id}`;
                  const isLoading = actionLoading === v.id;

                  return (
                    <tr key={v.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{donorName}</p>
                        <p className="text-xs text-gray-600">ID #{v.donor_id}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{details.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate">{details.hospital ?? "—"}</td>
                      <td className="px-4 py-3">
                        {v.proof_document_url ? (
                          <button
                            onClick={() => setProofModal(v.proof_document_url!)}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-white/15 hover:border-white/30 transition-colors"
                          >
                            <img src={v.proof_document_url} alt="Proof" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <FileImage className="w-3.5 h-3.5" /> None
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(v.created_at), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3 text-center">
                        {v.verification_status === "pending" && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                        {v.verification_status === "verified" && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        )}
                        {v.verification_status === "rejected" && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                            <X className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {v.verification_status === "pending" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAction(v, "verified")}
                              disabled={isLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 text-xs font-medium transition-all disabled:opacity-50"
                            >
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(v, "rejected")}
                              disabled={isLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-xs font-medium transition-all disabled:opacity-50"
                            >
                              <ThumbsDown className="w-3 h-3" />
                              Reject
                            </button>
                          </div>
                        )}
                        {v.verification_status !== "pending" && (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [authenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem("bloodsync_admin") === "true";
  });
  const [tab, setTab] = useState<Tab>("overview");

  const unlock = () => {
    sessionStorage.setItem("bloodsync_admin", "true");
    setAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.removeItem("bloodsync_admin");
    setAuthenticated(false);
  };

  if (!authenticated) return <AdminGate onUnlock={unlock} />;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "donors", label: "Donors", icon: UserCog },
    { id: "verifications", label: "Verification Queue", icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs text-primary uppercase tracking-widest font-semibold mb-2">Super Admin</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Full control over BloodSync platform</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all bg-white/5 hover:bg-white/8"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="flex items-center gap-1 mb-6 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === id
                  ? "bg-primary text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/8"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "overview" && <OverviewTab />}
            {tab === "donors" && <DonorsTab />}
            {tab === "verifications" && <VerificationsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
