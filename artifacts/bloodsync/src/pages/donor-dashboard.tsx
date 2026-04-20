import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useGetDonor, getGetDonorQueryKey,
  useUpdateDonor,
  useCreateVerification,
  useListVerifications, getListVerificationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, Droplet, Activity, PhoneCall, MapPin, Calendar,
  ShieldCheck, AlertCircle, Loader2, CheckCircle2, TrendingUp,
  Upload, X, FileImage, Clock, Plus, BadgeCheck,
  ChevronDown, ChevronUp, Building2, User, Phone, LogOut,
  Sparkles, Award,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

async function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
          else { w = Math.round((w * MAX) / h); h = MAX; }
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type VerifyPhase = "idle" | "form" | "submitting" | "success";

// ─── Verify Donation Form (modal-style inside dashboard) ─────────────────────
function VerifyDonationForm({ donorId, onClose, onSuccess }: { donorId: number; onClose: () => void; onSuccess: () => void }) {
  const [recipientName, setRecipientName] = useState("");
  const [hospital, setHospital] = useState("");
  const [contact, setContact] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<VerifyPhase>("form");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: createVerification } = useCreateVerification();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image.", variant: "destructive" });
      return;
    }
    setDocFile(file);
    setDocPreview(URL.createObjectURL(file));
  }, [toast]);

  const handleSubmit = async () => {
    if (!recipientName.trim() || !hospital.trim()) {
      toast({ title: "Missing fields", description: "Recipient name and hospital are required.", variant: "destructive" });
      return;
    }
    setPhase("submitting");
    let proofUrl: string | undefined;
    if (docFile) {
      try { proofUrl = await compressImageToBase64(docFile); }
      catch { toast({ title: "Image processing failed", variant: "destructive" }); setPhase("form"); return; }
    }
    createVerification(
      { data: { donor_id: donorId, recipient_details: JSON.stringify({ name: recipientName.trim(), hospital: hospital.trim(), contact: contact.trim() }), proof_document_url: proofUrl } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVerificationsQueryKey() });
          setPhase("success");
          setTimeout(() => onSuccess(), 1800);
        },
        onError: () => { toast({ title: "Submission failed", variant: "destructive" }); setPhase("form"); },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="relative w-full max-w-md"
      >
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Verify Donation</h3>
                <p className="text-xs text-gray-500">Submit proof of your donation</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <AnimatePresence mode="wait">
            {phase === "form" && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 flex items-center gap-1.5"><User className="w-3 h-3" /> Recipient Name *</Label>
                  <Input placeholder="e.g. Rahim Uddin" value={recipientName} onChange={e => setRecipientName(e.target.value)} className="bg-white/5 border-white/10 text-white h-11 rounded-xl focus-visible:ring-primary placeholder:text-gray-600" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Hospital *</Label>
                  <Input placeholder="e.g. Dhaka Medical College" value={hospital} onChange={e => setHospital(e.target.value)} className="bg-white/5 border-white/10 text-white h-11 rounded-xl focus-visible:ring-primary placeholder:text-gray-600" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 flex items-center gap-1.5"><Phone className="w-3 h-3" /> Recipient Contact <span className="text-gray-600">(optional)</span></Label>
                  <Input placeholder="+880 1712-345678" value={contact} onChange={e => setContact(e.target.value)} className="bg-white/5 border-white/10 text-white h-11 rounded-xl focus-visible:ring-primary placeholder:text-gray-600" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 flex items-center gap-1.5"><FileImage className="w-3 h-3" /> Proof Document <span className="text-gray-600">(optional)</span></Label>
                  {docPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
                      <img src={docPreview} alt="Document preview" className="w-full max-h-32 object-cover" />
                      <button onClick={() => { setDocFile(null); setDocPreview(null); }} className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <div
                      onDragOver={e => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 transition-all ${dragging ? "border-primary/60 bg-primary/8" : "border-white/10 bg-white/3 hover:border-white/20"}`}
                    >
                      <Upload className={`w-5 h-5 ${dragging ? "text-primary" : "text-gray-600"}`} />
                      <p className="text-xs text-gray-400">Drag & drop or <span className="text-primary font-medium">browse</span></p>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                    </div>
                  )}
                </div>
                <Button onClick={handleSubmit} disabled={!recipientName.trim() || !hospital.trim()} className="w-full h-11 rounded-xl btn-glow-red text-white border-0 font-semibold disabled:opacity-40">
                  Submit for Verification
                </Button>
              </motion.div>
            )}

            {phase === "submitting" && (
              <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-white text-sm">Submitting verification...</p>
              </motion.div>
            )}

            {phase === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 py-6">
                <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-amber-400" />
                </div>
                <div className="text-center">
                  <h4 className="text-white font-bold text-base mb-1">Submitted</h4>
                  <p className="text-xs text-gray-400 max-w-[260px]">Your donation is now pending admin review.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ─── Mock Donations Timeline ─────────────────────────────────────────────────
type TimelineItem = {
  id: string | number;
  date: Date;
  recipient: string;
  hospital: string;
  status: "verified" | "pending" | "rejected";
  isMock?: boolean;
};

function DonationTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-12 px-6 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
          <Heart className="w-5 h-5 text-gray-500" />
        </div>
        <p className="text-sm text-gray-400 font-medium">No donations yet</p>
        <p className="text-xs text-gray-600 mt-1 max-w-xs">Once you donate, your verified history will appear here as a timeline.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-white/10 to-transparent" />

      <div className="space-y-6">
        {items.map((item, idx) => {
          const isVerified = item.status === "verified";
          const isPending = item.status === "pending";
          const isRejected = item.status === "rejected";

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="relative"
            >
              {/* Dot */}
              <div className={`absolute -left-[18px] top-1.5 w-3 h-3 rounded-full ring-4 ring-[#0a0a0c] ${
                isVerified ? "bg-primary shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                : isPending ? "bg-amber-400"
                : "bg-gray-600"
              }`} />

              <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] hover:border-white/15 transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white truncate">{item.recipient}</p>
                      {item.isMock && (
                        <span className="text-[10px] uppercase tracking-wider text-gray-600 border border-gray-700 rounded-full px-1.5 py-0.5">demo</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> {item.hospital}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{format(item.date, "MMM d, yyyy")}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{formatDistanceToNow(item.date, { addSuffix: true })}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  {isVerified && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full font-medium">
                      <ShieldCheck className="w-3 h-3" /> Verified Donation
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium">
                      <Clock className="w-3 h-3" /> Pending Review
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      <X className="w-3 h-3" /> Rejected
                    </span>
                  )}
                  {isVerified && (
                    <span className="text-xs text-emerald-400/80 flex items-center gap-1">
                      <Heart className="w-3 h-3" fill="currentColor" /> +3 lives
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Donor Dashboard ────────────────────────────────────────────────────
export default function DonorDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [donorId, setDonorId] = useState<number | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("bloodsync_donor_id");
    if (stored) setDonorId(Number(stored));
  }, []);

  const { data: donor, isLoading } = useGetDonor(donorId!, {
    query: { enabled: !!donorId, queryKey: getGetDonorQueryKey(donorId!) },
  });

  const { data: allVerifications } = useListVerifications({
    query: { queryKey: getListVerificationsQueryKey(), enabled: !!donorId },
  });

  const updateDonor = useUpdateDonor();

  const toggleAvailability = () => {
    if (!donor || isToggling) return;
    setIsToggling(true);
    updateDonor.mutate(
      { id: donor.id, data: { is_willing_to_donate: !donor.is_willing_to_donate } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDonorQueryKey(donor.id) });
          toast({
            title: donor.is_willing_to_donate ? "You're now Unavailable" : "You're now Active",
            description: donor.is_willing_to_donate ? "Hidden from donor search." : "Visible to people seeking blood.",
          });
          setIsToggling(false);
        },
        onError: () => {
          toast({ title: "Update failed", variant: "destructive" });
          setIsToggling(false);
        },
      }
    );
  };

  const handleSignOut = () => {
    localStorage.removeItem("bloodsync_donor_id");
    setLocation("/");
  };

  // ─── Empty / loading states ────────────────────────────────────
  if (!donorId) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center px-6">
        <GlassCard className="p-10 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">No donor profile found</h2>
          <p className="text-gray-400 mb-6">Register as a donor first to access your dashboard.</p>
          <Button onClick={() => setLocation("/register")} className="btn-glow-red text-white border-0 rounded-xl">
            <Heart className="w-4 h-4 mr-2" fill="currentColor" />
            Register as Donor
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center px-6">
        <GlassCard className="p-10 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Profile not found</h2>
          <p className="text-gray-400 mb-6">We couldn't find your donor profile.</p>
          <Button onClick={() => { localStorage.removeItem("bloodsync_donor_id"); setLocation("/register"); }} className="btn-glow-red text-white border-0 rounded-xl">
            Register Again
          </Button>
        </GlassCard>
      </div>
    );
  }

  // ─── Build timeline (real verifications + mock historical entries) ─────────
  const myVerifications = (allVerifications ?? []).filter(v => v.donor_id === donor.id);

  const realItems: TimelineItem[] = myVerifications.map(v => {
    let details: { name?: string; hospital?: string } = {};
    try { details = JSON.parse(v.recipient_details); } catch { details = { name: v.recipient_details }; }
    return {
      id: v.id,
      date: new Date(v.created_at),
      recipient: details.name ?? "Unknown",
      hospital: details.hospital ?? "Unknown hospital",
      status: v.verification_status as "verified" | "pending" | "rejected",
    };
  });

  // Mock historical donations for visual depth (only shown if no real verifications yet)
  const mockItems: TimelineItem[] = realItems.length === 0 && donor.last_donation_date ? [
    {
      id: "mock-1",
      date: new Date(donor.last_donation_date),
      recipient: "Ahsan Habib",
      hospital: "Square Hospital, Dhaka",
      status: "verified",
      isMock: true,
    },
    {
      id: "mock-2",
      date: new Date(new Date(donor.last_donation_date).getTime() - 90 * 24 * 60 * 60 * 1000),
      recipient: "Tahmina Begum",
      hospital: "United Hospital, Dhaka",
      status: "verified",
      isMock: true,
    },
  ] : [];

  const timelineItems = [...realItems, ...mockItems].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="min-h-screen pt-32 pb-20 w-full px-6 sm:px-10 lg:px-16">

      {/* Verification Modal */}
      <AnimatePresence>
        {verifyOpen && (
          <VerifyDonationForm
            donorId={donor.id}
            onClose={() => setVerifyOpen(false)}
            onSuccess={() => setVerifyOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between flex-wrap gap-4 mb-10"
        >
          <div>
            <p className="text-xs text-primary uppercase tracking-[0.25em] font-semibold mb-2">Donor Dashboard</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Welcome back, <span className="glow-red-text">{donor.name.split(" ")[0]}</span>
            </h1>
            <p className="text-gray-400 mt-2">Manage your donor profile and track your impact</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-white px-4 py-2 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/10 hover:bg-white/[0.08] transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>

        {/* TOP SUMMARY CARD — Profile + Status Toggle */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-6 overflow-hidden shadow-[0_8px_50px_rgba(0,0,0,0.4)]">
            {/* Ambient red glow */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Identity block */}
              <div className="flex items-center gap-5 flex-1">
                {/* Blood Group monogram */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.25)]">
                    <span className="text-3xl md:text-4xl font-black text-white" style={{ textShadow: "0 0 20px rgba(239,68,68,0.6)" }}>
                      {donor.blood_group}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary border-4 border-[#0a0a0c] flex items-center justify-center">
                    <Droplet className="w-3 h-3 text-white" fill="currentColor" />
                  </div>
                </div>

                {/* Name + meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h2 className="text-2xl md:text-3xl font-bold text-white truncate">{donor.name}</h2>
                    {donor.successful_donations >= 3 && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        <Award className="w-3 h-3" /> Hero
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-500" /> {donor.district}</span>
                    <span className="flex items-center gap-1.5"><PhoneCall className="w-3.5 h-3.5 text-gray-500" /> {donor.whatsapp_number}</span>
                    <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-gray-500" /> {donor.smoker ? "Smoker" : "Non-smoker"}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Member since {format(new Date(donor.created_at), "MMMM yyyy")}</p>
                </div>
              </div>

              {/* Status Toggle */}
              <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300 ${
                donor.is_willing_to_donate
                  ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                  : "bg-white/5 border-white/10"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    donor.is_willing_to_donate ? "bg-emerald-500/15" : "bg-white/5"
                  }`}>
                    {donor.is_willing_to_donate
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      : <AlertCircle className="w-5 h-5 text-gray-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {donor.is_willing_to_donate ? "Active" : "Unavailable"}
                    </p>
                    <p className="text-xs text-gray-500 max-w-[160px]">
                      {donor.is_willing_to_donate ? "Willing to donate" : "Hidden from search"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                  {isToggling && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                  <Switch
                    checked={donor.is_willing_to_donate}
                    onCheckedChange={toggleAvailability}
                    disabled={isToggling}
                    className="data-[state=checked]:bg-emerald-500 scale-110"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* TWO STATS WIDGETS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6"
        >
          {/* Profile Requests */}
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/[0.07] transition-all overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
            <div className="relative flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-[0.18em] font-medium mb-2">Profile Requests Received</p>
                <p className="text-5xl font-black text-white tabular-nums">{donor.total_requests_received}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="relative text-xs text-gray-500">People who reached out to you in emergencies</p>
            <div className="relative mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${Math.min(donor.total_requests_received * 10, 100)}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
              />
            </div>
          </div>

          {/* Verified Donations */}
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/[0.07] transition-all overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/15 blur-3xl rounded-full pointer-events-none" />
            <div className="relative flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-[0.18em] font-medium mb-2">Verified Donations</p>
                <p className="text-5xl font-black glow-red-text tabular-nums">{donor.successful_donations}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="relative text-xs text-gray-500 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-primary" />
              Up to <span className="text-primary font-semibold">{donor.successful_donations * 3}</span> lives saved through your donations
            </p>
            <div className="relative mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${Math.min(donor.successful_donations * 20, 100)}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-full bg-gradient-to-r from-primary to-red-400"
              />
            </div>
          </div>
        </motion.div>

        {/* TIMELINE + ACTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Donation Timeline</h3>
                <p className="text-sm text-gray-500">Your history of verified blood donations and life-saving acts</p>
              </div>
              <Button
                onClick={() => setVerifyOpen(true)}
                className="btn-glow-red text-white border-0 rounded-xl px-5 h-10 text-sm font-semibold"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Verify Donation
              </Button>
            </div>

            <DonationTimeline items={timelineItems} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
