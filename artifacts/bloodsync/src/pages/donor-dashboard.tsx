import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  useGetDonor,
  getGetDonorQueryKey,
  useUpdateDonor,
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

export default function DonorDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [donorId, setDonorId] = useState<number | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("bloodsync_donor_id");
    if (stored) {
      setDonorId(Number(stored));
    }
  }, []);

  const { data: donor, isLoading } = useGetDonor(donorId!, {
    query: {
      enabled: !!donorId,
      queryKey: getGetDonorQueryKey(donorId!),
    },
  });

  const updateDonor = useUpdateDonor();

  const toggleAvailability = async () => {
    if (!donor || isToggling) return;
    setIsToggling(true);
    updateDonor.mutate(
      {
        id: donor.id,
        data: { is_willing_to_donate: !donor.is_willing_to_donate },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetDonorQueryKey(donor.id),
          });
          toast({
            title: donor.is_willing_to_donate
              ? "Status set to Unavailable"
              : "Status set to Available",
            description: donor.is_willing_to_donate
              ? "You're now hidden from donor search."
              : "You're now visible to people who need blood.",
          });
          setIsToggling(false);
        },
        onError: () => {
          toast({
            title: "Update failed",
            description: "Could not update your status. Please try again.",
            variant: "destructive",
          });
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
          <p className="text-gray-400 mb-6">
            You need to register as a donor first to access your dashboard.
          </p>
          <Button
            onClick={() => setLocation("/register")}
            className="bg-primary hover:bg-primary/90 text-white"
          >
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
          <p className="text-gray-400 mb-6">
            We couldn't find your donor profile. Please register again.
          </p>
          <Button
            onClick={() => {
              localStorage.removeItem("bloodsync_donor_id");
              setLocation("/register");
            }}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Register Again
          </Button>
        </GlassCard>
      </div>
    );
  }

  const bloodGroupColor = BLOOD_GROUP_COLORS[donor.blood_group] ?? "text-primary";
  const successRate =
    donor.total_requests_received > 0
      ? Math.round((donor.successful_donations / donor.total_requests_received) * 100)
      : 0;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-xs text-primary uppercase tracking-widest font-semibold mb-2">
            Donor Dashboard
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Welcome back, {donor.name.split(" ")[0]}
          </h1>
          <p className="text-gray-400 mt-1">Manage your donor profile and track your impact</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-1"
          >
            <GlassCard className="p-6 h-full flex flex-col">
              {/* Blood Group Badge */}
              <div className="flex items-center justify-between mb-6">
                <div
                  className={`text-5xl font-black ${bloodGroupColor}`}
                  style={{ textShadow: "0 0 30px currentColor" }}
                >
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
                    Last donated:{" "}
                    {format(new Date(donor.last_donation_date), "MMM d, yyyy")}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-400">
                  <Activity className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                  {donor.smoker ? "Smoker" : "Non-smoker"}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  Member since{" "}
                  {format(new Date(donor.created_at), "MMMM yyyy")}
                </p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Availability Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard
                className={`p-6 border transition-colors duration-500 ${
                  donor.is_willing_to_donate
                    ? "border-emerald-500/25 bg-emerald-500/5"
                    : "border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
                        donor.is_willing_to_donate
                          ? "bg-emerald-500/15 border-emerald-500/40"
                          : "bg-white/5 border-white/15"
                      }`}
                    >
                      {donor.is_willing_to_donate ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {donor.is_willing_to_donate
                          ? "Available to Donate"
                          : "Currently Unavailable"}
                      </h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {donor.is_willing_to_donate
                          ? "You appear in search results for people seeking blood"
                          : "You're hidden from donor search — toggle to become visible"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isToggling && (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    )}
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {/* Requests Received */}
              <GlassCard className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Profile Requests Received</p>
                    <p className="text-4xl font-black text-white">
                      {donor.total_requests_received}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      People who reached out to you
                    </p>
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
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                        style={{ width: `${successRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </GlassCard>

              {/* Successful Donations */}
              <GlassCard className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Verified Donations</p>
                    <p className="text-4xl font-black text-primary">
                      {donor.successful_donations}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Confirmed life-saving acts
                    </p>
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

            {/* Impact Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {donor.successful_donations === 0 ? (
                <GlassCard className="p-6 text-center">
                  <Heart className="w-8 h-8 text-primary mx-auto mb-3 opacity-50" />
                  <p className="text-gray-300 font-medium">Your first donation awaits</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Make sure your status is set to Available so people can reach you.
                  </p>
                </GlassCard>
              ) : (
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Heart className="w-5 h-5 text-primary" fill="currentColor" />
                    <h3 className="text-white font-semibold">Your Impact</h3>
                  </div>
                  <p className="text-gray-300">
                    You've donated{" "}
                    <span className="text-primary font-bold">
                      {donor.successful_donations} time{donor.successful_donations > 1 ? "s" : ""}
                    </span>
                    , potentially saving up to{" "}
                    <span className="text-white font-bold">
                      {donor.successful_donations * 3} lives
                    </span>
                    . Thank you for being a hero.
                  </p>
                </GlassCard>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
