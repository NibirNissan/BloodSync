import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Calendar, AlertCircle, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DnaHelixBackground } from "@/components/DnaHelix";
import { supabase, type Blog } from "@/lib/supabase";

export default function BlogDetail() {
  const [, params] = useRoute<{ id: string }>("/blog/:id");
  const id = params?.id ? Number(params.id) : null;

  const { data: blog, isLoading, error } = useQuery({
    queryKey: ["supabase", "blogs", "detail", id],
    enabled: !!id,
    queryFn: async (): Promise<Blog | null> => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as Blog | null;
    },
  });

  return (
    <div className="relative min-h-screen pt-32 pb-24 w-full">
      {/* Subtle 3D DNA backdrop — same cinematic theme as home */}
      <DnaHelixBackground />

      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-6 -ml-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </Link>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : error || !blog ? (
            <div className="bg-[#0a0a0c]/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-10 text-center shadow-2xl">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white mb-1">Blog not found</h2>
              <p className="text-sm text-gray-400">
                এই ব্লগটি পাওয়া যায়নি অথবা সরিয়ে নেওয়া হয়েছে।
              </p>
            </div>
          ) : (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[#0a0a0c]/85 backdrop-blur-2xl border border-white/15 rounded-3xl overflow-hidden shadow-2xl"
            >
              {blog.cover_url && (
                <div className="relative w-full h-64 sm:h-96 overflow-hidden bg-black/40">
                  <img
                    src={blog.cover_url}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
                </div>
              )}

              <div className="p-7 sm:p-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium font-en mb-4">
                  <Newspaper className="w-3 h-3" /> Awareness Blog
                </div>
                <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
                  {blog.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-8 font-en">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(blog.created_at).toLocaleDateString(undefined, {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </div>

                <p className="text-lg text-white/80 leading-relaxed mb-8 italic border-l-2 border-primary/40 pl-5">
                  {blog.excerpt}
                </p>

                <div className="prose prose-invert max-w-none">
                  {blog.content.split(/\n+/).map((para, i) => (
                    <p key={i} className="text-base text-white/85 leading-loose mb-5 whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>

                <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between flex-wrap gap-4">
                  <p className="text-sm text-gray-400">আজই রক্তদাতা হিসেবে যুক্ত হন।</p>
                  <Link href="/register">
                    <Button className="btn-glow-red text-white border-0 rounded-xl px-6 h-11 font-semibold">
                      Register as Donor
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.article>
          )}
        </div>
      </div>
    </div>
  );
}
