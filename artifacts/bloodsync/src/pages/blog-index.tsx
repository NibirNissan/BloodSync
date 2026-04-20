import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Newspaper, Loader2, ImageIcon, Sparkles } from "lucide-react";
import { DnaHelixBackground } from "@/components/DnaHelix";
import { supabase, type Blog } from "@/lib/supabase";

export default function BlogIndex() {
  const { data: blogs = [], isLoading, error } = useQuery({
    queryKey: ["supabase", "blogs", "public", "all"] as const,
    queryFn: async (): Promise<Blog[]> => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Blog[];
    },
    retry: false,
  });

  return (
    <div className="relative min-h-screen pt-32 pb-24 w-full">
      <DnaHelixBackground />

      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md text-primary text-xs font-medium font-en mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Awareness & Education
            </div>
            <h1
              className="text-5xl md:text-6xl font-bold text-white tracking-tight"
              style={{ textShadow: "0 2px 18px rgba(0,0,0,0.85)" }}
            >
              <span
                className="text-red-500 inline-block"
                style={{ filter: "drop-shadow(0 0 14px rgba(239,0,51,0.55))" }}
              >
                রক্তদান
              </span>{" "}
              ব্লগ
            </h1>
            <p className="text-gray-400 mt-3 max-w-2xl">
              রক্তদান, স্বাস্থ্য সচেতনতা ও জীবন রক্ষার গল্প — সব এক জায়গায়।
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : error || blogs.length === 0 ? (
            <div className="bg-[#0a0a0c]/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-12 text-center shadow-2xl">
              <Newspaper className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white mb-1">No blogs yet</h2>
              <p className="text-sm text-gray-400">
                শীঘ্রই নতুন ব্লগ প্রকাশিত হবে। ফিরে দেখুন।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {blogs.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link href={`/blog/${b.id}`}>
                    <article className="group h-full bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/15 rounded-3xl overflow-hidden hover:bg-[#0a0a0c]/90 hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-2xl flex flex-col">
                      <div className="relative h-44 w-full overflow-hidden bg-white/5">
                        {b.cover_url ? (
                          <img
                            src={b.cover_url}
                            alt={b.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-700" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-semibold text-white font-en">
                          <Newspaper className="w-3 h-3 text-primary" /> BLOG
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {b.title}
                        </h3>
                        <p className="text-sm text-white/75 leading-relaxed line-clamp-3 mb-4 flex-1">
                          {b.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 font-en">
                            {new Date(b.created_at).toLocaleDateString()}
                          </span>
                          <span className="inline-flex items-center gap-1 text-primary font-semibold font-en group-hover:gap-2 transition-all">
                            Read more <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
