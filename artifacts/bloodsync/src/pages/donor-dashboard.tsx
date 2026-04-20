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
import { uploadVerificationImage } from "@/lib/upload";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type VerifyPhase = "form" | "submitting" | "pending";

// ─── Verify Recent Donation (inline section embedded in dashboard) ───────────
function VerifyRecentDonationSection({ donorId }: { donorId: number }) {
  const [recipientName, setRecipientName] = useState("");
  const [hospital, setHospital] = useState("");
  const [contact, setContact] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<VerifyPhase>("form");
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [submittedRecipient, setSubmittedRecipient] = useState("");
  const [submittedHospital, setSubmittedHospital] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: createVerification } = useCreateVerification();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({ title: "File too large", description: "Maximum file size is 10 MB.", variant: "destructive" });
      return;
    }
    setDocFile(file);
    setDocPreview(URL.createObjectURL(file));
  }, [toast]);

  const isValid = recipientName.trim().length > 1 && hospital.trim().length > 1;

  const handleSubmit = async () => {
    if (!isValid) {
      toast({ title: "Missing fields", description: "Recipient name and hospital are required.", variant: "destructive" });
      return;
    }
    setPhase("submitting");
    let proofUrl: string | undefined;
    if (docFile) {
      try {
        const { objectPath } = await uploadVerificationImage(docFile, donorId);
        proofUrl = objectPath;
      } catch (err) {
        toast({
          title: "Upload failed",
          description: err instanceof Error ? err.message : "Could not upload proof image.",
          variant: "destructive",
        });
        setPhase("form");
        return;
      }
    }
    const recipient = recipientName.trim();
    const hosp = hospital.trim();
    createVerification(
      { data: { donor_id: donorId, recipient_details: JSON.stringify({ name: recipient, hospital: hosp, contact: contact.trim() }), proof_document_url: proofUrl } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVerificationsQueryKey() });
          setSubmittedAt(new Date());
          setSubmittedRecipient(recipient);
          setSubmittedHospital(hosp);
          setPhase("pending");
        },
        onError: () => { toast({ title: "Submission failed", variant: "destructive" }); setPhase("form"); },
      }
    );
  };

  const resetForm = () => {
    setRecipientName(""); setHospital(""); setContact("");
    setDocFile(null); setDocPreview(null);
    setSubmittedAt(null); setSubmittedRecipient(""); setSubmittedHospital("");
    setPhase("form");
  };

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden shadow-[0_8px_50px_rgba(0,0,0,0.4)]">
      {/* Ambient amber glow when pending, red glow on form */}
      <div className={`absolute -top-32 -left-32 w-72 h-72 blur-[100px] rounded-full pointer-events-none transition-colors duration-700 ${
        phase === "pending" ? "bg-amber-500/15" : "bg-primary/8"
      }`} />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-colors ${
            phase === "pending"
              ? "bg-amber-500/15 border-amber-500/30"
              : "bg-primary/15 border-primary/30"
          }`}>
            {phase === "pending"
              ? <Clock className="w-5 h-5 text-amber-400" />
              : <BadgeCheck className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Verify Recent Donation</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {phase === "pending"
                ? "Your submission is awaiting admin review"
                : "Submit proof to add this donation to your verified history"}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ─── PHASE: FORM ─── */}
        {phase === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="relative grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Left column — fields */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 uppercase tracking-[0.15em] font-medium flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Recipient Name <span className="text-primary">*</span>
                </Label>
                <Input
                  placeholder="e.g. Rahim Uddin"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary/40 placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 uppercase tracking-[0.15em] font-medium flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Hospital Name <span className="text-primary">*</span>
                </Label>
                <Input
                  placeholder="e.g. Dhaka Medical College Hospital"
                  value={hospital}
                  onChange={e => setHospital(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary/40 placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 uppercase tracking-[0.15em] font-medium flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Recipient Contact Number
                  <span className="text-gray-600 normal-case tracking-normal text-[10px]">(optional)</span>
                </Label>
                <Input
                  placeholder="+880 1712 345 678"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary/40 placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Right column — upload zone + submit */}
            <div className="flex flex-col gap-5">
              <div className="space-y-1.5 flex-1 flex flex-col">
                <Label className="text-xs text-gray-400 uppercase tracking-[0.15em] font-medium flex items-center gap-1.5">
                  <FileImage className="w-3 h-3" /> Proof Document
                  <span className="text-gray-600 normal-case tracking-normal text-[10px]">(hospital slip / photo)</span>
                </Label>
                {docPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex-1 min-h-[200px]">
                    <img src={docPreview} alt="Document preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <button
                      onClick={() => { setDocFile(null); setDocPreview(null); }}
                      className="absolute top-3 right-3 w-8 h-8 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-xs text-white/90">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate font-medium">{docFile?.name ?? "Document attached"}</span>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-2xl flex-1 min-h-[200px] flex flex-col items-center justify-center gap-3 px-6 transition-all ${
                      dragging
                        ? "border-primary/60 bg-primary/10 scale-[1.01]"
                        : "border-white/15 bg-white/[0.03] hover:bg-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                      dragging
                        ? "bg-primary/20 border border-primary/40 shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                        : "bg-white/5 border border-white/10"
                    }`}>
                      <Upload className={`w-6 h-6 ${dragging ? "text-primary" : "text-gray-500"}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-white font-medium mb-1">
                        {dragging ? "Drop to upload" : "Drag & drop your document"}
                      </p>
                      <p className="text-xs text-gray-500">
                        or <span className="text-primary font-semibold underline-offset-2 hover:underline">click to browse</span> · PNG, JPG up to 10MB
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                  </div>
                )}
              </div>

              {/* Submit — vibrant glow when valid */}
              <Button
                onClick={handleSubmit}
                disabled={!isValid}
                className={`w-full h-12 rounded-xl text-base font-semibold border-0 transition-all duration-300 ${
                  isValid
                    ? "btn-glow-red text-white"
                    : "bg-white/[0.04] text-gray-600 cursor-not-allowed"
                }`}
              >
                {isValid ? (
                  <>
                    <BadgeCheck className="w-4 h-4 mr-2" />
                    Submit for Verification
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2 opacity-40" />
                    Fill required fields
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─── PHASE: SUBMITTING ─── */}
        {phase === "submitting" && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex flex-col items-center gap-4 py-12"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
              <Loader2 className="w-10 h-10 text-primary animate-spin relative" />
            </div>
            <p className="text-white text-sm font-medium">Submitting your verification...</p>
            <p className="text-xs text-gray-500">Securely uploading proof document</p>
          </motion.div>
        )}

        {/* ─── PHASE: PENDING VERIFICATION ─── */}
        {phase === "pending" && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="flex flex-col items-center text-center py-8 px-4">
              {/* Glowing yellow/orange badge */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.45, delay: 0.1 }}
                className="relative mb-5"
              >
                {/* Outer pulsing ambient glow */}
                <motion.div
                  className="absolute inset-0 bg-amber-400/30 blur-2xl rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/30 to-amber-600/10 border-2 border-amber-400/40 flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.5)]">
                  <Clock className="w-9 h-9 text-amber-300" strokeWidth={2.5} />
                </div>
              </motion.div>

              {/* Glowing pill badge */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-bold uppercase tracking-[0.2em] mb-4 shadow-[0_0_25px_rgba(251,191,36,0.3)]"
              >
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full w-2 h-2 bg-amber-400" />
                </span>
                Pending Verification
              </motion.div>

              <motion.h4
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-white mb-2"
              >
                Submission Received
              </motion.h4>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="text-sm text-gray-400 max-w-md mb-6"
              >
                Our admins are reviewing your proof document. You'll be notified once it's approved — typically within 24 hours.
              </motion.p>

              {/* Submitted summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2.5 text-left"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><User className="w-3 h-3" /> Recipient</span>
                  <span className="text-white font-medium truncate ml-3">{submittedRecipient}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Hospital</span>
                  <span className="text-white font-medium truncate ml-3">{submittedHospital}</span>
                </div>
                {submittedAt && (
                  <div className="flex items-center justify-between text-sm pt-2.5 border-t border-white/5">
                    <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Submitted</span>
                    <span className="text-amber-300 font-medium">{format(submittedAt, "MMM d, yyyy · h:mm a")}</span>
                  </div>
                )}
              </motion.div>

              {/* Submit another */}
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                onClick={resetForm}
                className="mt-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Verify another donation
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

        {/* VERIFY RECENT DONATION — inline section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="mb-6"
        >
          <VerifyRecentDonationSection donorId={donor.id} />
        </motion.div>

        {/* TIMELINE */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Donation Timeline</h3>
              <p className="text-sm text-gray-500">Your history of verified blood donations and life-saving acts</p>
            </div>

            <DonationTimeline items={timelineItems} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
