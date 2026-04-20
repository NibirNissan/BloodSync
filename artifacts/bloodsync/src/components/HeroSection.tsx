import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Droplet } from "lucide-react";

/**
 * Cinematic hero — two-column composition:
 *  • LEFT: Deeply frosted glass panel with red-glow edge, an internal SVG
 *    pattern of interconnected blood-cell nodes, headline, subtitle,
 *    description, and two capsule CTAs.
 *  • RIGHT: A compassionate medical professional photo, masked into the
 *    page atmosphere with vertical and edge gradient fades so the figure
 *    feels woven into the dark background rather than a hard cutout.
 *  • The shared <DnaHelixBackground/> remains as the page-wide backdrop;
 *    its left-side helix shapes naturally read as "behind the panel".
 */
export function HeroSection() {
  return (
    <section className="relative w-full px-6 sm:px-10 lg:px-16 mb-28">
      {/* Soft red ambient pool centered behind the panel for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-0 w-[55%] h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(239,0,51,0.18) 0%, rgba(239,0,51,0.05) 35%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center max-w-[1500px] mx-auto">

        {/* ─────────────── LEFT: Glass panel with text + CTAs ─────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="lg:col-span-7 relative"
        >
          {/* Outer red glow halo around the panel */}
          <div
            aria-hidden
            className="absolute -inset-px rounded-[2rem] opacity-90 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(239,0,51,0.55), rgba(239,0,51,0.05) 35%, transparent 60%, rgba(239,0,51,0.35))",
              filter: "blur(2px)",
            }}
          />

          <div
            className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-[#0a0a0c]/72 backdrop-blur-3xl px-8 sm:px-12 py-12 sm:py-14 shadow-[0_30px_120px_-20px_rgba(239,0,51,0.45),0_8px_40px_rgba(0,0,0,0.6)]"
          >
            {/* Internal abstract pattern: interconnected blood-cell nodes */}
            <BloodCellNodesPattern />

            {/* Subtle inner highlight along top edge */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
              }}
            />

            <div className="relative">
              {/* Eyebrow pill */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/35 bg-primary/10 backdrop-blur-md text-primary text-xs font-semibold mb-7 font-en tracking-[0.18em] uppercase"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Save Lives Today
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-extrabold tracking-tight leading-[1.05] text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl"
                style={{ textShadow: "0 4px 24px rgba(0,0,0,0.85)" }}
              >
                রক্তদান করুন,{" "}
                <span
                  className="text-red-500 inline-block"
                  style={{ filter: "drop-shadow(0 0 18px rgba(239,0,51,0.55))" }}
                >
                  জীবন বাঁচান
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-6 text-xl sm:text-2xl font-medium text-white/90 leading-snug"
                style={{ textShadow: "0 2px 14px rgba(0,0,0,0.85)" }}
              >
                কারো জীবনের{" "}
                <span className="text-red-400">স্পন্দন</span> হোন আজই।
              </motion.p>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-5 text-base sm:text-lg text-white/75 leading-relaxed max-w-xl"
                style={{ textShadow: "0 1px 10px rgba(0,0,0,0.8)" }}
              >
                আপনার একটি ছোট পদক্ষেপ কারো পুরো পৃথিবী বদলে দিতে পারে।
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-9 flex flex-col sm:flex-row gap-4"
              >
                {/* PRIMARY: solid glowing red */}
                <Link href="/register" className="group">
                  <button
                    className="relative w-full sm:w-auto h-16 px-8 rounded-full font-semibold text-white border-0 overflow-hidden transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                    style={{
                      background:
                        "linear-gradient(135deg, #ef0033 0%, #c2002a 60%, #8a001e 100%)",
                      boxShadow:
                        "0 0 0 1px rgba(255,255,255,0.08) inset, 0 14px 40px -8px rgba(239,0,51,0.7), 0 0 60px rgba(239,0,51,0.45)",
                    }}
                  >
                    {/* Top sheen */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-1/2 rounded-t-full opacity-60"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.2), transparent)",
                      }}
                    />
                    <Heart className="relative w-5 h-5" fill="currentColor" />
                    <span className="relative flex flex-col items-start leading-tight">
                      <span className="text-lg font-bold">দান করুন</span>
                      <span className="text-[10px] tracking-[0.22em] font-en text-white/85">
                        REGISTER AS DONOR
                      </span>
                    </span>
                    <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>

                {/* SECONDARY: clean white with red accent */}
                <Link href="/find-donors" className="group">
                  <button
                    className="relative w-full sm:w-auto h-16 px-8 rounded-full font-semibold border border-white/30 bg-white text-zinc-900 overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-white hover:border-primary/50 flex items-center justify-center gap-3"
                    style={{
                      boxShadow:
                        "0 14px 40px -10px rgba(255,255,255,0.25), 0 0 30px rgba(239,0,51,0.18)",
                    }}
                  >
                    <Droplet className="relative w-5 h-5 text-primary" fill="currentColor" />
                    <span className="relative flex flex-col items-start leading-tight">
                      <span className="text-lg font-bold text-zinc-900">
                        রিকোয়েস্ট করুন
                      </span>
                      <span className="text-[10px] tracking-[0.22em] font-en text-primary font-bold">
                        REQUEST FOR BLOOD
                      </span>
                    </span>
                    <ArrowRight className="relative w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </motion.div>

              {/* Trust signal row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="mt-8 flex items-center gap-6 text-xs text-white/55 font-en"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Verified donors
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Privacy first
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Instant match
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ─────────────── RIGHT: Compassionate doctor figure ─────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
          className="lg:col-span-5 relative h-[420px] sm:h-[520px] lg:h-[640px] order-first lg:order-last"
        >
          <DoctorFigure />
        </motion.div>

      </div>
    </section>
  );
}

/* ───────────────────────── Internal subcomponents ───────────────────────── */

/**
 * Subtle abstract pattern of interconnected blood-cell nodes inside the
 * glass panel. Pure SVG — animates a slow rotational drift so the panel
 * feels "alive" without distracting from the text.
 */
function BloodCellNodesPattern() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 700"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full opacity-[0.18] pointer-events-none"
    >
      <defs>
        <radialGradient id="cell" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef0033" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#7a0019" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0a0a0c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="link" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef0033" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ef0033" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Connecting lines between nodes */}
      <g stroke="url(#link)" strokeWidth="1">
        <line x1="80"  y1="120" x2="240" y2="200" />
        <line x1="240" y1="200" x2="120" y2="350" />
        <line x1="120" y1="350" x2="320" y2="430" />
        <line x1="320" y1="430" x2="500" y2="320" />
        <line x1="500" y1="320" x2="430" y2="120" />
        <line x1="430" y1="120" x2="240" y2="200" />
        <line x1="320" y1="430" x2="220" y2="600" />
        <line x1="220" y1="600" x2="450" y2="560" />
        <line x1="500" y1="320" x2="450" y2="560" />
      </g>

      {/* Blood-cell nodes (toroidal-looking circles with darker centers) */}
      {[
        { cx: 80,  cy: 120, r: 22 },
        { cx: 240, cy: 200, r: 30 },
        { cx: 120, cy: 350, r: 26 },
        { cx: 320, cy: 430, r: 38 },
        { cx: 500, cy: 320, r: 28 },
        { cx: 430, cy: 120, r: 20 },
        { cx: 220, cy: 600, r: 24 },
        { cx: 450, cy: 560, r: 30 },
      ].map((n, i) => (
        <g key={i}>
          <circle cx={n.cx} cy={n.cy} r={n.r} fill="url(#cell)" />
          <circle
            cx={n.cx}
            cy={n.cy}
            r={n.r * 0.45}
            fill="#0a0a0c"
            opacity="0.55"
          />
        </g>
      ))}
    </svg>
  );
}

/**
 * Compassionate medical professional figure — uses an Unsplash photo of a
 * doctor and masks it with vertical + horizontal gradients so the figure
 * blends into the dark cinematic atmosphere instead of sitting as a hard
 * rectangular cutout.
 */
function DoctorFigure() {
  return (
    <div className="relative w-full h-full">
      {/* The photo itself */}
      <img
        src="https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=1400&q=85&auto=format&fit=crop"
        alt="Compassionate medical professional"
        className="absolute inset-0 w-full h-full object-cover object-center rounded-[2rem]"
        style={{
          // Mask the figure into the background using a soft radial fade.
          maskImage:
            "radial-gradient(ellipse 80% 95% at 60% 45%, black 55%, transparent 95%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 95% at 60% 45%, black 55%, transparent 95%)",
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />

      {/* Color grade overlay — pulls everything toward the dark red theme */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[2rem]"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,12,0.15) 0%, rgba(10,10,12,0.05) 30%, rgba(10,10,12,0.55) 100%)",
          mixBlendMode: "multiply",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 rounded-[2rem]"
        style={{
          background:
            "linear-gradient(135deg, rgba(239,0,51,0.18) 0%, transparent 40%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* Left-edge fade so the figure visually blends INTO the glass panel */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-32 lg:w-40"
        style={{
          background:
            "linear-gradient(90deg, #0a0a0c 0%, rgba(10,10,12,0.6) 50%, transparent 100%)",
        }}
      />

      {/* Floating badge — pulse heart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="absolute bottom-8 right-8 bg-[#0a0a0c]/85 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-3 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/35 flex items-center justify-center"
          >
            <Heart className="w-4 h-4 text-primary" fill="currentColor" />
          </motion.div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/55 font-en">
              Live now
            </p>
            <p className="text-sm font-bold text-white font-en">
              Beating for you
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
