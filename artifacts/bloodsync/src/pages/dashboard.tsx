import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { resolveProofUrl } from "@/lib/upload";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ChangePasswordCard } from "@/components/ChangePasswordCard";
import { useAuth } from "@/lib/auth";
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
  useListDonors, getListDonorsQueryKey,
  useCreateDonor,
  useUpdateDonor,
  useDeleteDonor,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Droplet, ShieldCheck, Activity, AlertCircle, Clock, CheckCircle2,
  LayoutDashboard, UserCog, ClipboardList,
  Plus, Pencil, Trash2, X, ChevronDown, Search, Building2,
  Phone, MapPin, Calendar, TrendingUp, LogOut, Loader2,
  ThumbsUp, ThumbsDown, FileImage, KeyRound, Newspaper,
} from "lucide-react";
import { BlogManagement } from "@/components/BlogManagement";
import { format } from "date-fns";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const DISTRICTS = ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Barisal", "Rangpur", "Mymensingh", "Comilla", "Narayanganj", "Gazipur", "Other"];

type Tab = "overview" | "donors" | "verifications";

// ─── Add / Edit Donor Modal ───────────────────────────────────────────────────
type DonorRecord = NonNullable<ReturnType<typeof useListDonors>["data"]> extends ReadonlyArray<infer T> ? T : any;

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

// ─── Donor Details (View) ────────────────────────────────────────────────────
function DonorDetailsModal({ donor, onClose }: { donor: DonorRecord; onClose: () => void }) {
  const fields: Array<{ icon: React.ElementType; label: string; value: string | number; accent?: string }> = [
    { icon: Droplet, label: "Blood Group", value: donor.blood_group, accent: "text-primary" },
    { icon: MapPin, label: "District", value: donor.district },
    { icon: Phone, label: "WhatsApp", value: donor.whatsapp_number },
    { icon: Activity, label: "Lifestyle", value: donor.smoker ? "Smoker" : "Non-smoker" },
    { icon: CheckCircle2, label: "Availability", value: donor.is_willing_to_donate ? "Active — willing to donate" : "Unavailable", accent: donor.is_willing_to_donate ? "text-emerald-400" : "text-gray-500" },
    { icon: Calendar, label: "Last Donation", value: donor.last_donation_date ? format(new Date(donor.last_donation_date), "PPP") : "Never recorded" },
    { icon: AlertCircle, label: "Requests Received", value: donor.total_requests_received },
    { icon: ShieldCheck, label: "Verified Donations", value: donor.successful_donations, accent: "text-primary" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg"
      >
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_60px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/15 blur-[100px] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="relative flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.25)]">
                <span className="text-2xl font-black text-white" style={{ textShadow: "0 0 15px rgba(239,68,68,0.6)" }}>
                  {donor.blood_group}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{donor.name}</h3>
                <p className="text-xs text-gray-500">Donor ID #{donor.id} · since {format(new Date(donor.created_at), "MMM yyyy")}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Field grid */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.label} className="flex items-start gap-3 p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">{f.label}</p>
                  <p className={`text-sm font-medium truncate ${f.accent ?? "text-white"}`}>{f.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-5 pt-4 border-t border-white/5 text-xs text-gray-600 text-center">
            Read-only view · use Edit to modify donor data
          </div>
        </div>
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

  const statCards = [
    {
      label: "Total Donors",
      value: stats?.total_donors,
      sub: `${stats?.willing_donors ?? 0} actively willing to donate`,
      icon: Users,
      accent: "from-blue-500/30 to-blue-500/0",
      glow: "shadow-[0_0_50px_rgba(59,130,246,0.15)]",
      iconBg: "bg-blue-500/15 border-blue-500/25",
      iconColor: "text-blue-400",
      ring: "border-blue-500/20",
    },
    {
      label: "Total Requests Processed",
      value: stats?.total_requests,
      sub: "Emergency contacts made through platform",
      icon: AlertCircle,
      accent: "from-purple-500/30 to-purple-500/0",
      glow: "shadow-[0_0_50px_rgba(168,85,247,0.15)]",
      iconBg: "bg-purple-500/15 border-purple-500/25",
      iconColor: "text-purple-400",
      ring: "border-purple-500/20",
    },
    {
      label: "Total Verified Donations",
      value: stats?.completed_donations,
      sub: "Confirmed life-saving acts",
      icon: Droplet,
      accent: "from-primary/40 to-primary/0",
      glow: "shadow-[0_0_50px_rgba(239,68,68,0.18)]",
      iconBg: "bg-primary/15 border-primary/30",
      iconColor: "text-primary",
      ring: "border-primary/25",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {statCards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`relative overflow-hidden bg-white/5 backdrop-blur-xl border ${card.ring} rounded-3xl p-6 ${card.glow}`}
        >
          {/* Ambient glow */}
          <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br ${card.accent} blur-3xl rounded-full pointer-events-none`} />

          <div className="relative">
            <div className="flex items-start justify-between mb-5">
              <div className={`w-12 h-12 rounded-2xl border ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              {!statsLoading && (
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-semibold mb-2">{card.label}</p>
            <p className="text-5xl font-black text-white mb-2 tracking-tight">
              {statsLoading ? <span className="text-gray-800">—</span> : (card.value ?? 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">{card.sub}</p>
          </div>
        </motion.div>
      ))}
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
  const [viewDonor, setViewDonor] = useState<DonorRecord | null>(null);
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
        {viewDonor && (
          <DonorDetailsModal
            key="view"
            donor={viewDonor}
            onClose={() => setViewDonor(null)}
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
            className="h-10 px-5 rounded-xl btn-glow-red text-white font-semibold border-0 shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" /> Manual Add Donor
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
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setViewDonor(donor)}
                          title="View details"
                          className="w-8 h-8 rounded-lg bg-blue-500/5 hover:bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:text-blue-300 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditDonor(donor)}
                          title="Edit donor"
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(donor.id)}
                          title="Delete donor"
                          className="w-8 h-8 rounded-lg bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-all"
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
// Supabase-backed: reads from `donations_verification` joined with `donors`.
interface VerifRecord {
  id: number;
  donor_id: number;
  recipient_details: string;
  proof_document_url: string | null;
  verification_status: "pending" | "verified" | "rejected";
  created_at: string;
  donor: { name: string; successful_donations: number } | null;
}

const SUPABASE_VERIFICATIONS_KEY = ["supabase", "admin", "verifications"] as const;

function VerificationsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: verifications, isLoading, error: listError } = useQuery<VerifRecord[]>({
    queryKey: SUPABASE_VERIFICATIONS_KEY,
    queryFn: async (): Promise<VerifRecord[]> => {
      const { data, error } = await supabase
        .from("donations_verification")
        .select("id, donor_id, recipient_details, proof_document_url, verification_status, created_at, donor:donors(name, successful_donations)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as VerifRecord[];
    },
  });

  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [proofModal, setProofModal] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!verifications) return [];
    if (filter === "all") return verifications;
    return verifications.filter(v => v.verification_status === filter);
  }, [verifications, filter]);

  const handleAction = async (v: VerifRecord, status: "verified" | "rejected") => {
    setActionLoading(v.id);
    try {
      // Atomic, idempotent server-side action — see init.sql.
      const rpc = status === "verified" ? "approve_verification" : "reject_verification";
      const { error: rpcErr } = await supabase.rpc(rpc, { p_id: v.id });
      if (rpcErr) throw rpcErr;

      queryClient.invalidateQueries({ queryKey: SUPABASE_VERIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ["supabase", "donors"] });
      queryClient.invalidateQueries({ queryKey: getListDonorsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
      toast({
        title: status === "verified" ? "Verification approved — donor count incremented" : "Verification rejected",
      });
    } catch (err: any) {
      // Always refetch so the UI reflects the true state even on partial failure.
      queryClient.invalidateQueries({ queryKey: SUPABASE_VERIFICATIONS_KEY });
      toast({
        title: "Action failed",
        description: err?.message || "Could not update verification.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
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
        {listError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Could not load verifications from Supabase.</p>
              <p className="text-red-300/80 text-xs mt-0.5 break-all">{(listError as Error).message}</p>
            </div>
          </div>
        )}
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
                  const donorName = v.donor?.name ?? `Donor #${v.donor_id}`;
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
                        {(() => {
                          const proofSrc = resolveProofUrl(v.proof_document_url);
                          return proofSrc ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setProofModal(proofSrc)}
                                title="Click to enlarge"
                                className="group relative w-12 h-12 rounded-lg overflow-hidden border border-white/15 hover:border-primary/50 transition-all hover:shadow-[0_0_15px_rgba(220,38,38,0.35)]"
                              >
                                <img src={proofSrc} alt="Proof document" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </button>
                              <a
                                href={proofSrc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-primary/80 hover:text-primary underline underline-offset-2"
                              >
                                Open
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              <FileImage className="w-3.5 h-3.5" /> None
                            </span>
                          );
                        })()}
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleAction(v, "verified")}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-b from-emerald-500/30 to-emerald-600/10 hover:from-emerald-500/45 hover:to-emerald-600/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold transition-all disabled:opacity-50 shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:shadow-[0_0_28px_rgba(16,185,129,0.6)]"
                            >
                              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(v, "rejected")}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-b from-red-500/30 to-red-600/10 hover:from-red-500/45 hover:to-red-600/20 border border-red-400/40 text-red-200 text-xs font-bold transition-all disabled:opacity-50 shadow-[0_0_18px_rgba(239,68,68,0.35)] hover:shadow-[0_0_28px_rgba(239,68,68,0.6)]"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
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

// ─── Main Dashboard — single full-width page ─────────────────────────────────
export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, profile, loading, signOut } = useAuth();

  // Auth + role gate. While loading OR while the profile row for an
  // authenticated user is still resolving, show a loader so admins
  // never momentarily see the "Access denied" card on refresh.
  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center w-full">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center w-full px-6">
        <GlassCard className="p-8 max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Sign in required</h2>
          <p className="text-sm text-gray-500 mb-5">
            অ্যাডমিন এলাকায় প্রবেশ করতে সাইন ইন করুন।
          </p>
          <Button
            onClick={() => setLocation("/login")}
            className="w-full h-11 btn-glow-red text-white border-0 rounded-xl"
          >
            Go to Login
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center w-full px-6">
        <GlassCard className="p-8 max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Access denied</h2>
          <p className="text-sm text-gray-500">
            এই এলাকা শুধুমাত্র Super Admin-দের জন্য সংরক্ষিত।
          </p>
        </GlassCard>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  return (
    <div className="min-h-screen pt-28 pb-20 w-full px-6 sm:px-10 lg:px-16 relative overflow-hidden">
      {/* Ambient red glow backdrop */}
      <div className="pointer-events-none absolute -top-40 left-1/4 w-[700px] h-[700px] bg-primary/5 blur-[140px] rounded-full" />
      <div className="pointer-events-none absolute top-1/2 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />

      <div className="relative w-full space-y-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between flex-wrap gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs text-primary uppercase tracking-[0.25em] font-bold font-en">Super Admin</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              নিয়ন্ত্রণ <span className="glow-red-text">কেন্দ্র</span>
            </h1>
            <p className="text-gray-400 mt-2 text-base">BloodSync প্ল্যাটফর্মের পূর্ণ পরিচালনা নিয়ন্ত্রণ</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2.5 rounded-full transition-all bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08]"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>

        {/* ── OVERVIEW WIDGETS ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Live Overview</h2>
              <p className="text-xs text-gray-500">Platform-wide metrics, updated in real time</p>
            </div>
          </div>
          <OverviewTab />
        </section>

        {/* ── VERIFICATION QUEUE ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Verification Queue</h2>
              <p className="text-xs text-gray-500">Approve or reject donor-submitted donation proofs</p>
            </div>
          </div>
          <VerificationsTab />
        </motion.section>

        {/* ── DONOR MANAGEMENT ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <UserCog className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Donor Management</h2>
              <p className="text-xs text-gray-500">View, edit, or remove any donor — or add one manually</p>
            </div>
          </div>
          <DonorsTab />
        </motion.section>

        {/* ── BLOG MANAGEMENT ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Manage Blogs</h2>
              <p className="text-xs text-gray-500">Create, publish, and manage awareness blog posts</p>
            </div>
          </div>
          <BlogManagement />
        </motion.section>

        {/* ── ACCOUNT — Change Password ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Account Security</h2>
              <p className="text-xs text-gray-500">আপনার পাসওয়ার্ড নিয়মিত পরিবর্তন করে অ্যাকাউন্ট নিরাপদ রাখুন</p>
            </div>
          </div>
          <div className="max-w-xl">
            <ChangePasswordCard />
          </div>
        </motion.section>

      </div>
    </div>
  );
}
