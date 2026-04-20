import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useGetDonor,
  getGetDonorQueryKey,
  useUpdateDonor,
  useCreateVerification,
  useListVerifications,
  getListVerificationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  Droplet,
  Activity,
  PhoneCall,
  MapPin,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Upload,
  X,
  FileImage,
  Clock,
  Plus,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Building2,
  User,
  Phone,
} from "lucide-react";
import { format } from "date-fns";

const BLOOD_GROUP_COLORS: Record<string, string> = {
  "A+": "text-rose-400",
  "A-": "text-rose-500",
  "B+": "text-orange-400",
  "B-": "text-orange-500",
  "AB+": "text-purple-400",
  "AB-": "text-purple-500",
  "O+": "text-primary",
  "O-": "text-red-600",
};

async function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
          else { w = Math.round((w * MAX) / h); h = MAX; }
        }
        canvas.width = w;
        canvas.height = h;
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

function VerifyDonationSection({ donorId }: { donorId: number }) {
  const [phase, setPhase] = useState<VerifyPhase>("idle");
  const [showHistory, setShowHistory] = useState(false);

  // Form state
  const [recipientName, setRecipientName] = useState("");
  const [hospital, setHospital] = useState("");
  const [contact, setContact] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: createVerification, isPending } = useCreateVerification();
  const { data: allVerifications } = useListVerifications({
    query: { queryKey: getListVerificationsQueryKey() },
  });

  const myVerifications = allVerifications?.filter((v) => v.donor_id === donorId) ?? [];
  const pending = myVerifications.filter((v) => v.verification_status === "pending");
  const verified = myVerifications.filter((v) => v.verification_status === "verified");

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    setDocFile(file);
    const url = URL.createObjectURL(file);
    setDocPreview(url);
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const resetForm = () => {
    setRecipientName("");
    setHospital("");
    setContact("");
    setDocFile(null);
    setDocPreview(null);
    setPhase("idle");
  };

  const handleSubmit = async () => {
    if (!recipientName.trim() || !hospital.trim()) {
      toast({ title: "Missing fields", description: "Recipient name and hospital are required.", variant: "destructive" });
      return;
    }
    setPhase("submitting");
    const recipientDetails = JSON.stringify({
      name: recipientName.trim(),
      hospital: hospital.trim(),
      contact: contact.trim(),
    });

    let proofUrl: string | undefined;
    if (docFile) {
      try {
        proofUrl = await compressImageToBase64(docFile);
      } catch {
        toast({ title: "Image processing failed", description: "Could not process the image. Try another file.", variant: "destructive" });
        setPhase("form");
        return;
      }
    }

    createVerification(
      {
        data: {
          donor_id: donorId,
          recipient_details: recipientDetails,
          proof_document_url: proofUrl,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVerificationsQueryKey() });
          setPhase("success");
        },
        onError: () => {
          toast({ title: "Submission failed", description: "Could not submit your verification. Please try again.", variant: "destructive" });
          setPhase("form");
        },
      }
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <GlassCard className="p-6 space-y-4">

        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Verify a Donation</h3>
              <p className="text-xs text-gray-500">Submit proof after donating blood</p>
            </div>
          </div>

          {/* Verified badge count */}
          {verified.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              {verified.length} verified
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">

          {/* PHASE: idle */}
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {pending.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/8 border border-amber-500/20 rounded-xl mb-4">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-300">
                    You have <span className="font-semibold">{pending.length}</span> pending verification{pending.length > 1 ? "s" : ""} awaiting admin review.
                  </p>
                </div>
              )}

              <Button
                onClick={() => setPhase("form")}
                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200 text-sm font-medium"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Submit New Verification
              </Button>
            </motion.div>
          )}

          {/* PHASE: form */}
          {phase === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-300 font-medium">Donation Details</p>
                <button onClick={resetForm} className="text-gray-600 hover:text-gray-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Recipient Name */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Recipient Name <span className="text-primary">*</span>
                </Label>
                <Input
                  placeholder="e.g. Rahim Uddin"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-11 rounded-xl focus-visible:ring-primary placeholder:text-gray-600"
                />
              </div>

              {/* Hospital */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Hospital / Clinic <span className="text-primary">*</span>
                </Label>
                <Input
                  placeholder="e.g. Dhaka Medical College Hospital"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-11 rounded-xl focus-visible:ring-primary placeholder:text-gray-600"
                />
              </div>

              {/* Recipient Contact */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Recipient Contact <span className="text-gray-600 text-xs">(optional)</span>
                </Label>
                <Input
                  placeholder="e.g. +880 1712-345678"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-11 rounded-xl focus-visible:ring-primary placeholder:text-gray-600"
                />
              </div>

              {/* Document Upload */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 flex items-center gap-1.5">
                  <FileImage className="w-3 h-3" /> Proof Document <span className="text-gray-600 text-xs">(hospital slip / donation card)</span>
                </Label>

                {docPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
                    <img src={docPreview} alt="Document preview" className="w-full max-h-40 object-cover" />
                    <button
                      onClick={() => { setDocFile(null); setDocPreview(null); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="px-3 py-2 border-t border-white/8">
                      <p className="text-xs text-gray-400 truncate">{docFile?.name}</p>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 transition-all duration-200 ${
                      dragging
                        ? "border-primary/60 bg-primary/8"
                        : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <Upload className={`w-6 h-6 ${dragging ? "text-primary" : "text-gray-600"}`} />
                    <p className="text-sm text-gray-400 text-center">
                      Drag & drop or <span className="text-primary font-medium">browse</span>
                    </p>
                    <p className="text-xs text-gray-600">PNG, JPG, JPEG — max 5MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!recipientName.trim() || !hospital.trim()}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-40"
              >
                Submit for Verification
              </Button>
            </motion.div>
          )}

          {/* PHASE: submitting */}
          {phase === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold mb-1">Submitting verification...</p>
                <p className="text-sm text-gray-500">Processing your document</p>
              </div>
            </motion.div>
          )}

          {/* PHASE: success */}
          {phase === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-amber-400" />
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-bold text-white mb-1">Verification Submitted</h4>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Your donation record is now pending admin review. Once verified, your donation count will be updated.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-300">Pending Verification</p>
                  <p className="text-xs text-gray-500">Admin will review and approve</p>
                </div>
              </div>

              <Button
                onClick={resetForm}
                variant="outline"
                className="w-full h-11 rounded-xl border-white/10 text-gray-300 hover:bg-white/5"
              >
                Submit Another
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verification History */}
        {myVerifications.length > 0 && phase === "idle" && (
          <div className="pt-2 border-t border-white/8">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-300 transition-colors py-1"
            >
              <span>Verification history ({myVerifications.length})</span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-3">
                    {myVerifications.map((v) => {
                      let details: { name?: string; hospital?: string; contact?: string } = {};
                      try { details = JSON.parse(v.recipient_details); } catch { details = { name: v.recipient_details }; }
                      const isVerified = v.verification_status === "verified";
                      return (
                        <div key={v.id} className="flex items-start gap-3 px-3 py-2.5 bg-white/3 border border-white/8 rounded-xl">
                          <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isVerified ? "bg-primary/15" : "bg-amber-500/10"}`}>
                            {isVerified
                              ? <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                              : <Clock className="w-3.5 h-3.5 text-amber-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <p className="text-sm text-white font-medium truncate">{details.name ?? "—"}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${isVerified ? "bg-primary/10 text-primary border border-primary/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                                {isVerified ? "Verified" : "Pending"}
                              </span>
                            </div>
                            {details.hospital && <p className="text-xs text-gray-500">{details.hospital}</p>}
                            <p className="text-xs text-gray-600 mt-0.5">{format(new Date(v.created_at), "MMM d, yyyy")}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

export default function DonorDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [donorId, setDonorId] = useState<number | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("bloodsync_donor_id");
    if (stored) setDonorId(Number(stored));
  }, []);

  const { data: donor, isLoading } = useGetDonor(donorId!, {
    query: { enabled: !!donorId, queryKey: getGetDonorQueryKey(donorId!) },
  });

  const updateDonor = useUpdateDonor();

  const toggleAvailability = async () => {
    if (!donor || isToggling) return;
    setIsToggling(true);
    updateDonor.mutate(
      { id: donor.id, data: { is_willing_to_donate: !donor.is_willing_to_donate } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDonorQueryKey(donor.id) });
          toast({
            title: donor.is_willing_to_donate ? "Status set to Unavailable" : "Status set to Available",
            description: donor.is_willing_to_donate
              ? "You're now hidden from donor search."
              : "You're now visible to people who need blood.",
          });
          setIsToggling(false);
        },
        onError: () => {
          toast({ title: "Update failed", description: "Could not update your status. Please try again.", variant: "destructive" });
          setIsToggling(false);
        },
      }
    );
  };

  if (!donorId) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <GlassCard className="p-10 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">No donor profile found</h2>
          <p className="text-gray-400 mb-6">You need to register as a donor first to access your dashboard.</p>
          <Button onClick={() => setLocation("/register")} className="bg-primary hover:bg-primary/90 text-white">
            <Heart className="w-4 h-4 mr-2" fill="currentColor" />
            Register as Donor
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <GlassCard className="p-10 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Profile not found</h2>
          <p className="text-gray-400 mb-6">We couldn't find your donor profile. Please register again.</p>
          <Button onClick={() => { localStorage.removeItem("bloodsync_donor_id"); setLocation("/register"); }} className="bg-primary hover:bg-primary/90 text-white">
            Register Again
          </Button>
        </GlassCard>
      </div>
    );
  }

  const bloodGroupColor = BLOOD_GROUP_COLORS[donor.blood_group] ?? "text-primary";
  const successRate = donor.total_requests_received > 0
    ? Math.round((donor.successful_donations / donor.total_requests_received) * 100)
    : 0;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs text-primary uppercase tracking-widest font-semibold mb-2">Donor Dashboard</p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Welcome back, {donor.name.split(" ")[0]}
            </h1>
            {donor.successful_donations > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/25 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                {donor.successful_donations} verified donation{donor.successful_donations > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-gray-400 mt-1">Manage your donor profile and track your impact</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-1">
            <GlassCard className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className={`text-5xl font-black ${bloodGroupColor}`} style={{ textShadow: "0 0 30px currentColor" }}>
                  {donor.blood_group}
                </div>
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Droplet className="w-7 h-7 text-primary" fill="currentColor" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mb-1">{donor.name}</h2>

              <div className="space-y-3 mt-4 flex-1">
                <div className="flex items-center text-sm text-gray-400">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                  {donor.district}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <PhoneCall className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                  {donor.whatsapp_number}
                </div>
                {donor.last_donation_date && (
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                    Last donated: {format(new Date(donor.last_donation_date), "MMM d, yyyy")}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-400">
                  <Activity className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                  {donor.smoker ? "Smoker" : "Non-smoker"}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500">Member since {format(new Date(donor.created_at), "MMMM yyyy")}</p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Availability Toggle */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <GlassCard className={`p-6 border transition-colors duration-500 ${donor.is_willing_to_donate ? "border-emerald-500/25 bg-emerald-500/5" : "border-white/10"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${donor.is_willing_to_donate ? "bg-emerald-500/15 border-emerald-500/40" : "bg-white/5 border-white/15"}`}>
                      {donor.is_willing_to_donate
                        ? <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        : <AlertCircle className="w-6 h-6 text-gray-500" />
                      }
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {donor.is_willing_to_donate ? "Available to Donate" : "Currently Unavailable"}
                      </h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {donor.is_willing_to_donate
                          ? "You appear in search results for people seeking blood"
                          : "You're hidden from donor search — toggle to become visible"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isToggling && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                    <Switch
                      checked={donor.is_willing_to_donate}
                      onCheckedChange={toggleAvailability}
                      disabled={isToggling}
                      className="data-[state=checked]:bg-emerald-500 scale-125"
                    />
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassCard className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Profile Requests Received</p>
                    <p className="text-4xl font-black text-white">{donor.total_requests_received}</p>
                    <p className="text-xs text-gray-500 mt-2">People who reached out to you</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <PhoneCall className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                {donor.total_requests_received > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Response rate</span>
                      <span className="text-emerald-400">{successRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full">
                      <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width: `${successRate}%` }} />
                    </div>
                  </div>
                )}
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Verified Donations</p>
                    <p className="text-4xl font-black text-primary">{donor.successful_donations}</p>
                    <p className="text-xs text-gray-500 mt-2">Confirmed life-saving acts</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs text-primary/70">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  Up to {donor.successful_donations * 3} lives saved
                </div>
              </GlassCard>
            </motion.div>

            {/* Verify Donation Section */}
            <VerifyDonationSection donorId={donor.id} />

          </div>
        </div>
      </div>
    </div>
  );
}
