import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Droplet, Users, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { useGetStatsSummary, getGetStatsSummaryQueryKey } from "@workspace/api-client-react";

export default function Home() {
  const { data: stats, isLoading } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey() }
  });

  return (
    <div className="min-h-screen pt-32 pb-20 flex flex-col">
      <main className="flex-1 container mx-auto px-4 md:px-6">
        <section className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Urgent need for blood donors
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight"
          >
            Be the lifeline <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
              someone needs today.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed"
          >
            Connect directly with people in medical emergencies. Every donation can save up to three lives. Register today or find a donor near you.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link href="/find-donors">
              <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 text-base h-14 px-8 rounded-xl font-semibold">
                Find Donors
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_rgba(220,38,38,0.4)] text-base h-14 px-8 rounded-xl font-semibold group">
                Register as Donor
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </section>

        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          <GlassCard className="flex flex-col items-center text-center p-8">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-4xl font-bold text-white mb-2">
              {isLoading ? "-" : stats?.willing_donors || 0}
            </h3>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Active Donors</p>
          </GlassCard>

          <GlassCard className="flex flex-col items-center text-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5"></div>
            <div className="relative z-10 w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
              <Droplet className="w-6 h-6 text-primary" fill="currentColor" />
            </div>
            <h3 className="relative z-10 text-4xl font-bold text-white mb-2">
              {isLoading ? "-" : stats?.completed_donations || 0}
            </h3>
            <p className="relative z-10 text-sm text-gray-400 font-medium uppercase tracking-wider">Lives Impacted</p>
          </GlassCard>

          <GlassCard className="flex flex-col items-center text-center p-8">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-4xl font-bold text-white mb-2">
              {isLoading ? "-" : stats?.total_requests || 0}
            </h3>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Requests Handled</p>
          </GlassCard>
        </motion.section>
      </main>
    </div>
  );
}
