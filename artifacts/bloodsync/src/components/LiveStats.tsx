import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Users, Droplet, ShieldCheck, type LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

/**
 * Live impact metrics — fetched directly from Supabase, animated via
 * framer-motion when the section enters the viewport.
 *
 * Schema assumptions (mirrors src/lib/supabase.ts Donor type):
 *   • donors.successful_donations  (integer)
 *   • donation_requests.status     ('pending' | 'completed' | …)
 *
 * Tables that don't exist yet return 0 silently — keeps the home page
 * looking great even before the user has run their schema.
 */

const STATS_QUERY_KEY = ["supabase", "stats", "summary"] as const;

type StatsSummary = {
  activeDonors: number;
  livesSaved: number;
  completedRequests: number;
};

async function fetchStats(): Promise<StatsSummary> {
  // Run all three queries in parallel for speed.
  const [donorsRes, sumRes, reqRes] = await Promise.all([
    supabase
      .from("donors")
      .select("id", { count: "exact", head: true })
      .eq("is_willing_to_donate", true),
    supabase.from("donors").select("successful_donations"),
    supabase
      .from("donation_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
  ]);

  const livesSaved =
    (sumRes.data ?? []).reduce(
      (acc: number, row: any) => acc + (Number(row?.successful_donations) || 0),
      0,
    );

  return {
    activeDonors: donorsRes.count ?? 0,
    livesSaved,
    completedRequests: reqRes.count ?? 0,
  };
}

export function LiveStats() {
  const { data } = useQuery({
    queryKey: STATS_QUERY_KEY,
    queryFn: fetchStats,
    // Fail silently — show zeros rather than an error UI on the home page.
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: { activeDonors: 0, livesSaved: 0, completedRequests: 0 },
  });

  const stats: { label: string; sublabel: string; value: number; Icon: LucideIcon; tint: string }[] = [
    {
      label: "সক্রিয় ডোনার",
      sublabel: "Active Donors",
      value: data?.activeDonors ?? 0,
      Icon: Users,
      tint: "rgba(96,165,250,1)", // blue-400
    },
    {
      label: "রক্ষিত জীবন",
      sublabel: "Lives Saved",
      value: data?.livesSaved ?? 0,
      Icon: Droplet,
      tint: "rgba(239,0,51,1)", // primary
    },
    {
      label: "সম্পন্ন অনুরোধ",
      sublabel: "Successful Requests",
      value: data?.completedRequests ?? 0,
      Icon: ShieldCheck,
      tint: "rgba(52,211,153,1)", // emerald-400
    },
  ];

  return (
    <section className="w-full px-6 sm:px-10 lg:px-16 mb-24">
      <div className="max-w-[1500px] mx-auto">
        {/* Section eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-xs text-primary uppercase tracking-[0.25em] font-semibold font-en mb-3">
            Live Impact
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold text-white tracking-tight"
            style={{ textShadow: "0 2px 18px rgba(0,0,0,0.85)" }}
          >
            প্রতিটি সংখ্যার পেছনে{" "}
            <span
              className="text-red-500"
              style={{ filter: "drop-shadow(0 0 14px rgba(239,0,51,0.55))" }}
            >
              একটি জীবন
            </span>
          </h2>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <StatCard key={s.label} index={i} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Stat Card ─────────────────────────── */

interface StatCardProps {
  label: string;
  sublabel: string;
  value: number;
  Icon: LucideIcon;
  tint: string;
  index: number;
}

function StatCard({ label, sublabel, value, Icon, tint, index }: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
      className="group relative rounded-3xl overflow-hidden border border-red-500/30 bg-[#0a0a0c]/65 backdrop-blur-2xl p-8 transition-all duration-500 hover:border-red-500/55"
      style={{
        boxShadow:
          // Outer red halo + deep inner shadow for the "neo-glass" feel
          "0 20px 60px -20px rgba(239,0,51,0.35), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -40px 60px -40px rgba(239,0,51,0.18), inset 0 0 60px rgba(0,0,0,0.45)",
      }}
    >
      {/* Soft red corner glow that intensifies on hover */}
      <div
        aria-hidden
        className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-50 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${tint.replace(",1)", ",0.35)")} 0%, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />

      {/* Top gradient hairline */}
      <div
        aria-hidden
        className="absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(239,0,51,0.55), transparent)",
        }}
      />

      <div className="relative">
        {/* Floating icon */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.4,
          }}
          className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-6 border"
          style={{
            background: `linear-gradient(135deg, ${tint.replace(",1)", ",0.18)")}, ${tint.replace(",1)", ",0.04)")})`,
            borderColor: tint.replace(",1)", ",0.35)"),
            boxShadow: `0 8px 24px -6px ${tint.replace(",1)", ",0.45)")}`,
          }}
        >
          <Icon className="w-6 h-6" style={{ color: tint }} />
        </motion.div>

        {/* Animated count-up number */}
        <CountUp
          to={value}
          start={inView}
          className="text-6xl md:text-7xl font-black text-white tabular-nums font-en leading-none"
          style={{
            textShadow:
              "0 0 30px rgba(239,0,51,0.45), 0 0 60px rgba(239,0,51,0.18), 0 2px 6px rgba(0,0,0,0.85)",
          }}
        />

        {/* Bengali label (Hind Siliguri via default font-bn) */}
        <p className="mt-4 text-lg font-bold text-white/95">{label}</p>

        {/* English sublabel (Poppins via font-en) */}
        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/55 font-en font-medium">
          {sublabel}
        </p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────── Count-Up ─────────────────────────── */

interface CountUpProps {
  to: number;
  start: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * framer-motion based count-up. Animates from 0 → `to` whenever `start`
 * flips true (i.e. when the parent enters the viewport) or whenever the
 * target value changes (e.g. after the Supabase fetch resolves).
 */
function CountUp({ to, start, className, style }: CountUpProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v).toLocaleString("en-US"));

  useEffect(() => {
    if (!start) return;
    const controls = animate(motionValue, to, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1], // expo-out — fast then settles
    });
    return () => controls.stop();
  }, [start, to, motionValue]);

  return (
    <motion.span className={className} style={style}>
      {rounded}
    </motion.span>
  );
}
