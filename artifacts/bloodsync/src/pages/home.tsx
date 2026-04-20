import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, Droplet, Users, ShieldCheck, Search, BarChart3,
  Zap, Heart, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetStatsSummary, getGetStatsSummaryQueryKey } from "@workspace/api-client-react";

export default function Home() {
  const { data: stats, isLoading } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey() }
  });

  const features = [
    {
      icon: Search,
      title: "Dynamic Donor Search",
      desc: "Filter live by blood group and district. Reach available donors in seconds when emergencies strike — no waiting, no hospitals in between.",
      accent: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      icon: BarChart3,
      title: "Global Statistics",
      desc: "Transparent, real-time metrics on donor activity, requests, and verified donations across every region we serve.",
      accent: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      icon: Zap,
      title: "Instant WhatsApp Connect",
      desc: "Skip the call center. A pre-filled WhatsApp message gets you talking to a donor directly within seconds of your request.",
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      icon: ShieldCheck,
      title: "Verified Donations",
      desc: "Every donation is reviewed and approved by our admin team. Donors build a trustworthy public track record over time.",
      accent: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/25",
    },
    {
      icon: Heart,
      title: "Donor-First Privacy",
      desc: "Contact details stay hidden until a recipient explicitly requests them. Donors stay in control of their visibility.",
      accent: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
    },
    {
      icon: MapPin,
      title: "Hyperlocal Matching",
      desc: "We prioritize donors closest to you, district by district. Faster matches mean faster lives saved.",
      accent: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  const liveStats = [
    { label: "Active Donors", value: stats?.willing_donors, icon: Users, color: "text-blue-400" },
    { label: "Lives Impacted", value: stats?.completed_donations, icon: Droplet, color: "text-primary" },
    { label: "Requests Handled", value: stats?.total_requests, icon: ShieldCheck, color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen pt-32 pb-24 w-full">

      {/* HERO — full width with breathing horizontal padding */}
      <section className="w-full px-6 sm:px-10 lg:px-16 mb-28">
        <div className="flex flex-col items-center text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md text-primary text-sm font-medium"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Urgent need for blood donors
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] max-w-6xl"
          >
            <span className="text-white">Be the lifeline</span>
            <br />
            <span className="glow-red-text">someone needs today.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed"
          >
            Connect directly with people in medical emergencies. Every donation can save up to three lives. Register today or find a donor near you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link href="/find-donors">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 backdrop-blur-md text-white text-base h-14 px-8 rounded-2xl font-semibold transition-all"
              >
                Find Donors
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto btn-glow-red text-white text-base h-14 px-8 rounded-2xl font-semibold group border-0"
              >
                Register as Donor
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* LIVE STATS STRIP — full width */}
      <section className="w-full px-6 sm:px-10 lg:px-16 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {liveStats.map((s, i) => (
            <div key={s.label} className={`text-center ${i > 0 ? "md:border-l md:border-white/10" : ""}`}>
              <div className={`inline-flex w-11 h-11 rounded-2xl ${s.color.replace("text", "bg")}/10 border border-white/10 items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-5xl font-black text-white tabular-nums">
                {isLoading ? <span className="text-gray-700">—</span> : s.value ?? 0}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-[0.18em] mt-2 font-medium">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* FEATURE CARDS — full width grid */}
      <section className="w-full px-6 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs text-primary uppercase tracking-[0.25em] font-semibold mb-3">What we do</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight max-w-3xl mx-auto">
            A platform built around <span className="glow-red-text">life</span>.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-2xl ${f.bg} border ${f.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <f.icon className={`w-5 h-5 ${f.accent}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="w-full px-6 sm:px-10 lg:px-16 mt-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-[2rem] p-12 md:p-20 text-center"
        >
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight max-w-3xl mx-auto leading-tight">
              Your blood type could be the only one available <span className="glow-red-text">when it matters most.</span>
            </h2>
            <p className="text-gray-400 mt-5 max-w-xl mx-auto">
              Join thousands of donors quietly saving lives across their cities. It takes less than two minutes to register.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="mt-8 btn-glow-red text-white text-base h-14 px-10 rounded-2xl font-semibold border-0 group"
              >
                Become a Donor
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
