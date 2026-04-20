import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Newspaper, Loader2, ImageIcon } from "lucide-react";
import { supabase, type Blog } from "@/lib/supabase";

/**
 * Renders the latest published blogs in a 3-column glassmorphism grid.
 * Used on the home page below the hero. Falls back gracefully when the
 * blogs table is empty or Supabase isn't configured.
 */
export function BlogList() {
  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["supabase", "blogs", "public"] as const,
    queryFn: async (): Promise<Blog[]> => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data ?? []) as Blog[];
    },
    // Fail silently — the home page should still render without blogs.
    retry: false,
  });

  // Hide the section entirely if no posts exist yet (prevents an empty
  // section when the user hasn't run the SQL seed yet).
  if (!isLoading && blogs.length === 0) return null;

  return (
    <section className="w-full px-6 sm:px-10 lg:px-16 mb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <p className="text-xs text-primary uppercase tracking-[0.25em] font-semibold font-en mb-3">
          Latest Awareness Blogs
        </p>
        <h2
          className="text-4xl md:text-5xl font-bold text-white tracking-tight max-w-3xl mx-auto"
          style={{ textShadow: "0 2px 18px rgba(0,0,0,0.85)" }}
        >
          <span
            className="text-red-500 inline-block"
            style={{ filter: "drop-shadow(0 0 14px rgba(239,0,51,0.55))" }}
          >
            সচেতনতা
          </span>{" "}
          ও তথ্যভিত্তিক ব্লগ
        </h2>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {blogs.slice(0, 3).map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
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
    </section>
  );
}
