import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper, Plus, Loader2, ImageIcon, Trash2, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase, type Blog } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const BLOGS_QUERY_KEY = ["supabase", "blogs", "admin"] as const;

// Invalidate every public blog view (home + index page) after a write.
function invalidatePublicBlogs(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["supabase", "blogs"] });
}

export function BlogManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: BLOGS_QUERY_KEY,
    queryFn: async (): Promise<Blog[]> => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Blog[];
    },
  });

  // Manual loading state instead of useMutation so we have full control
  // over the spinner — guaranteed to flip false in `finally`, and a
  // 12-second hard timeout below ensures it can never hang forever.
  const [submitting, setSubmitting] = useState(false);

  const handlePublish = async () => {
    // ── Per-field validation: surface the FIRST empty field as a toast.
    const t = title.trim();
    const ex = excerpt.trim();
    const c = content.trim();
    if (!t)  { toast({ variant: "destructive", title: "Title is required" }); return; }
    if (!ex) { toast({ variant: "destructive", title: "Excerpt is required" }); return; }
    if (!c)  { toast({ variant: "destructive", title: "Content is required" }); return; }

    setSubmitting(true);

    // 10 s hard safety timeout — if Supabase doesn't respond, we surface
    // the schema/connection error and unfreeze the button so the user
    // can never be stuck watching a forever-spinning spinner.
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      setSubmitting(false);
      toast({
        variant: "destructive",
        title: "Request timed out",
        description: "Database response timed out. Please check your connection or table schema.",
      });
    }, 10000);

    try {
      // ── Explicitly fetch the current authenticated user from Supabase.
      //    This bypasses any stale React-context state and guarantees we
      //    have the freshest auth.uid() to assign as author_uid.
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser?.id) {
        throw new Error("Not signed in. Please log in as an admin before publishing.");
      }

      // Insert payload — keys match the blogs table columns EXACTLY.
      // NOTE: author_uid (NOT author_id) is required to satisfy RLS.
      const payload = {
        title: t,
        excerpt: ex,
        content: c,
        cover_image_url: coverUrl.trim() || null,
        author_uid: authUser.id,
      };

      // Race the insert against a 10-second timeout so a hung Supabase
      // request can never freeze the UI. Whichever promise settles first wins.
      const insertPromise = supabase
        .from("blogs")
        .insert(payload)
        .select()
        .single();

      const timeoutPromise = new Promise<never>((_, reject) =>
        window.setTimeout(
          () => reject(new Error("Database response timed out. Please check your connection or table schema.")),
          10000,
        ),
      );

      const { data, error } = (await Promise.race([insertPromise, timeoutPromise])) as Awaited<typeof insertPromise>;

      // If the visible-spinner timeout already fired, abort silently —
      // the user has already been notified by the timeout toast above.
      if (timedOut) return;

      if (error) {
        console.error("Full Supabase Error:", error);
        throw error;
      }

      // Clear form fields.
      setTitle(""); setExcerpt(""); setContent(""); setCoverUrl("");
      setOpen(false);

      // Refresh the Manage Blogs list AND every public blog view so the
      // new post appears immediately on the home & blog index pages.
      await queryClient.invalidateQueries({ queryKey: BLOGS_QUERY_KEY });
      invalidatePublicBlogs(queryClient);

      toast({
        title: "Blog published",
        description: data?.title ? `"${data.title}" is now live.` : "নতুন ব্লগটি তালিকায় যোগ হয়েছে।",
      });
    } catch (e: any) {
      // Log the full error object so the exact reason is visible in DevTools.
      console.error("Full Supabase Error:", e);
      toast({
        variant: "destructive",
        title: "Failed to publish",
        description: e?.message || e?.hint || JSON.stringify(e) || "Could not save blog.",
      });
    } finally {
      window.clearTimeout(timeoutId);
      setSubmitting(false);
    }
  };

  const togglePublish = useMutation({
    mutationFn: async (b: Blog) => {
      const { error } = await supabase
        .from("blogs")
        .update({ is_published: !b.is_published })
        .eq("id", b.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidatePublicBlogs(queryClient);
    },
  });

  const deleteBlog = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("blogs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Blog deleted" });
      invalidatePublicBlogs(queryClient);
    },
  });

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Manage Blogs</h3>
            <p className="text-xs text-gray-400">সচেতনতামূলক ব্লগ পোস্ট তৈরি ও পরিচালনা করুন</p>
          </div>
        </div>
        <Button
          onClick={() => setOpen((v) => !v)}
          className="btn-glow-red text-white border-0 rounded-xl h-10 px-5 gap-2"
        >
          <Plus className="w-4 h-4" />
          {open ? "Cancel" : "New Blog"}
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={(e) => {
              e.preventDefault();
              handlePublish();
            }}
            className="overflow-hidden"
          >
            <div className="bg-black/30 border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
              <div>
                <Label className="text-xs text-gray-300">Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="রক্তদানের গুরুত্ব"
                  className="bg-white/5 border-white/10 text-white h-11 rounded-xl mt-1.5"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-300">Excerpt — সারাংশ *</Label>
                <Textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="সংক্ষিপ্ত বিবরণ — ১-২ লাইন যা হোম পেজে দেখানো হবে।"
                  rows={2}
                  className="bg-white/5 border-white/10 text-white rounded-xl mt-1.5 resize-none"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-300">Content — বিস্তারিত *</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="পূর্ণ ব্লগের বিষয়বস্তু লিখুন। অনুচ্ছেদ আলাদা করতে এন্টার চাপুন।"
                  rows={9}
                  className="bg-white/5 border-white/10 text-white rounded-xl mt-1.5 resize-y leading-relaxed"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Cover Image URL
                </Label>
                <Input
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="bg-white/5 border-white/10 text-white h-11 rounded-xl mt-1.5 font-en text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full btn-glow-red text-white border-0 rounded-xl h-11 gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Publish Blog
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Existing blogs list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : blogs.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">No blogs yet — create your first post.</p>
        ) : (
          blogs.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-4 bg-black/20 border border-white/10 rounded-2xl p-3 hover:border-white/20 transition-colors"
            >
              {b.cover_url ? (
                <img src={b.cover_url} alt="" className="w-16 h-16 rounded-xl object-cover bg-white/5 shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{b.title}</p>
                <p className="text-xs text-gray-400 truncate">{b.excerpt}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-en font-semibold ${
                    b.is_published ? "bg-emerald-500/15 text-emerald-300" : "bg-gray-500/15 text-gray-400"
                  }`}>
                    {b.is_published ? "PUBLISHED" : "DRAFT"}
                  </span>
                  <span className="text-[10px] text-gray-600 font-en">
                    {new Date(b.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm" variant="ghost"
                  onClick={() => togglePublish.mutate(b)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/5"
                  title={b.is_published ? "Unpublish" : "Publish"}
                >
                  {b.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm" variant="ghost"
                  onClick={() => {
                    if (confirm("Delete this blog permanently?")) deleteBlog.mutate(b.id);
                  }}
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
