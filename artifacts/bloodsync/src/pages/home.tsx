import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, Droplet, Users, ShieldCheck, Search, BarChart3,
  Zap, Heart, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DnaHelixBackground } from "@/components/DnaHelix";
import { BlogList } from "@/components/BlogList";
import { HeroSection } from "@/components/HeroSection";
import { LiveStats } from "@/components/LiveStats";

export default function Home() {
  const features = [
    {
      icon: Search,
      title: "তাৎক্ষণিক ডোনার অনুসন্ধান",
      desc: "রক্তের গ্রুপ ও জেলা অনুযায়ী সরাসরি ফিল্টার করুন। জরুরি মুহূর্তে কয়েক সেকেন্ডেই কাছের ডোনারের সাথে সংযোগ — কোনো অপেক্ষা নয়, কোনো মধ্যস্থতা নয়।",
      accent: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      icon: BarChart3,
      title: "সমন্বিত পরিসংখ্যান",
      desc: "প্রতিটি অঞ্চলের ডোনার কার্যক্রম, অনুরোধ ও যাচাইকৃত রক্তদানের স্বচ্ছ ও রিয়েল-টাইম পরিসংখ্যান।",
      accent: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      icon: Zap,
      title: "তাৎক্ষণিক WhatsApp যোগাযোগ",
      desc: "কল সেন্টারের ঝামেলা নয়। অনুরোধের সাথে সাথে প্রস্তুত একটি WhatsApp বার্তা সরাসরি ডোনারের কাছে পৌঁছে যায়।",
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      icon: ShieldCheck,
      title: "যাচাইকৃত রক্তদান",
      desc: "প্রতিটি দান আমাদের অ্যাডমিন টিম পর্যালোচনা ও অনুমোদন করেন। সময়ের সাথে সাথে ডোনাররা গড়ে তোলেন বিশ্বস্ত পাবলিক রেকর্ড।",
      accent: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/25",
    },
    {
      icon: Heart,
      title: "ডোনারের গোপনীয়তা সর্বাগ্রে",
      desc: "যতক্ষণ না কেউ স্পষ্টভাবে অনুরোধ করেন, ডোনারের যোগাযোগের তথ্য গোপন থাকে। তাঁদের দৃশ্যমানতা তাঁদেরই নিয়ন্ত্রণে।",
      accent: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
    },
    {
      icon: MapPin,
      title: "স্থানীয় ভিত্তিতে মিল",
      desc: "আমরা আপনার নিকটতম ডোনারদের অগ্রাধিকার দিই, জেলা ধরে ধরে। দ্রুত মিল মানেই দ্রুত জীবন রক্ষা।",
      accent: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  return (
    <div className="relative min-h-screen pt-32 pb-24 w-full">

      {/* Immersive 3D DNA helix — fixed full-viewport background.
          pointer-events:none so all CTAs stay clickable. */}
      <DnaHelixBackground />

      {/* All page content sits in front via z-10. */}
      <div className="relative z-10">

      {/* HERO — two-column glass-panel + doctor composition */}
      <HeroSection />

      {/* LATEST AWARENESS BLOGS — 3-column glassmorphism grid */}
      <BlogList />

      {/* LIVE IMPACT — animated counters from Supabase */}
      <LiveStats />

      {/* FEATURE CARDS — full width grid */}
      <section className="w-full px-6 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs text-primary uppercase tracking-[0.25em] font-semibold font-en mb-3">What we do</p>
          <h2
            className="text-4xl md:text-5xl font-bold text-white tracking-tight max-w-3xl mx-auto"
            style={{ textShadow: "0 2px 18px rgba(0,0,0,0.85)" }}
          >
            <span
              className="text-red-500 inline-block"
              style={{ filter: "drop-shadow(0 0 14px rgba(239,0,51,0.55))" }}
            >
              জীবনের
            </span>{" "}
            জন্য তৈরি একটি প্ল্যাটফর্ম।
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
              className="bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 hover:bg-[#0a0a0c]/90 hover:border-white/25 transition-all duration-300 group shadow-2xl"
            >
              <div className={`w-12 h-12 rounded-2xl ${f.bg} border ${f.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <f.icon className={`w-5 h-5 ${f.accent}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/75 leading-relaxed">{f.desc}</p>
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
          className="relative overflow-hidden bg-[#0a0a0c]/85 backdrop-blur-2xl border border-white/15 rounded-[2rem] p-12 md:p-20 text-center shadow-2xl"
        >
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative">
            <h2
              className="text-3xl md:text-5xl font-bold text-white tracking-tight max-w-3xl mx-auto leading-tight"
              style={{ textShadow: "0 2px 18px rgba(0,0,0,0.85)" }}
            >
              যখন সবচেয়ে বেশি প্রয়োজন,{" "}
              <span
                className="text-red-500 inline-block"
                style={{ filter: "drop-shadow(0 0 14px rgba(239,0,51,0.55))" }}
              >
                আপনার রক্তের গ্রুপই
              </span>{" "}
              হতে পারে একমাত্র উপায়।
            </h2>
            <p className="text-white/80 mt-5 max-w-xl mx-auto">
              শহরে শহরে নীরবে জীবন বাঁচাচ্ছেন এমন হাজারো ডোনারের সাথে যোগ দিন। নিবন্ধনে সময় লাগে দুই মিনিটেরও কম।
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="mt-8 btn-glow-red text-white text-base h-14 px-10 rounded-2xl font-semibold border-0 group"
              >
                Register as Donor
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      </div>
    </div>
  );
}
