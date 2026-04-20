-- ─────────────────────────────────────────────────────────────────────────────
-- BloodSync — Blogs table
-- Run this script ONCE in your Supabase SQL Editor (Dashboard → SQL Editor → New
-- query → paste → Run). It creates the table, indexes, RLS policies, and seeds
-- three Bengali awareness posts so the home page has live content.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blogs (
  id           bigserial PRIMARY KEY,
  title        text        NOT NULL,
  excerpt      text        NOT NULL,
  content      text        NOT NULL,
  cover_url    text,
  author_uid   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blogs_published_created_idx
  ON public.blogs (is_published, created_at DESC);

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION public.set_blogs_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blogs_updated_at ON public.blogs;
CREATE TRIGGER trg_blogs_updated_at
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION public.set_blogs_updated_at();

-- Row Level Security
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can read PUBLISHED posts
DROP POLICY IF EXISTS "Public read published blogs" ON public.blogs;
CREATE POLICY "Public read published blogs" ON public.blogs
  FOR SELECT USING (is_published = true);

-- Only admins (profiles.role = 'admin') can INSERT / UPDATE / DELETE
DROP POLICY IF EXISTS "Admins manage blogs" ON public.blogs;
CREATE POLICY "Admins manage blogs" ON public.blogs
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ─── Seed: 3 Bengali awareness blogs (only if table is empty) ────────────────
INSERT INTO public.blogs (title, excerpt, content, cover_url, is_published)
SELECT * FROM (VALUES
  (
    'রক্তদানের স্বাস্থ্যগত উপকারিতা',
    'নিয়মিত রক্তদান শুধু অন্যকে নয়, ডোনারের নিজের স্বাস্থ্যের জন্যও অসাধারণ উপকারী। হার্ট সুস্থ রাখা থেকে শুরু করে নতুন রক্তকোষ তৈরি — জানুন বিজ্ঞান কী বলে।',
    E'রক্তদান একটি মহৎ কাজ — কিন্তু এটি শুধু গ্রহীতার জন্য নয়, ডোনারের শরীরের জন্যও অগণিত উপকার বয়ে আনে।\n\n১. হার্টের স্বাস্থ্য সুরক্ষা: গবেষণায় দেখা গেছে নিয়মিত রক্তদানকারীদের হৃদরোগ ও স্ট্রোকের ঝুঁকি প্রায় ৩৩% পর্যন্ত কমে যায়। শরীর থেকে অতিরিক্ত আয়রন বের হয়ে গেলে রক্তনালীর ভেতরের প্রদাহ কমে।\n\n২. নতুন রক্তকোষ উৎপাদন: রক্তদানের পর শরীর দ্রুত নতুন তাজা লোহিত রক্তকণিকা তৈরি করে — ফলে শরীরের অক্সিজেন বহন ক্ষমতা ও বিপাক ক্রিয়া আরও সক্রিয় হয়।\n\n৩. বিনামূল্যে স্বাস্থ্য পরীক্ষা: প্রতিবার রক্তদানের আগে রক্তচাপ, হিমোগ্লোবিন, পালস ও সংক্রামক রোগের পরীক্ষা করা হয় — অনেক রোগ আগেভাগেই ধরা পড়ে।\n\n৪. ক্যালোরি ক্ষয়: এক ব্যাগ (৪৫০ মি.লি.) রক্তদান প্রায় ৬৫০ ক্যালোরি ক্ষয় করে — যা শরীরকে চাঙা রাখে।\n\n৫. মানসিক প্রশান্তি: কারো জীবন রক্ষা করার অনুভূতি — এর চেয়ে বড় মানসিক পুরস্কার আর কিছু হয় না। নিয়মিত ডোনাররা গবেষণায় উচ্চ মানসিক সুস্থতার সূচক প্রদর্শন করেন।\n\nএকজন সুস্থ প্রাপ্তবয়স্ক প্রতি ৩-৪ মাস অন্তর নিরাপদে রক্তদান করতে পারেন। আজই BloodSync-এ নিবন্ধন করে শুরু করুন এই জীবনদায়ী যাত্রা।',
    'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=1200&q=80',
    true
  ),
  (
    'কেন নিয়মিত রক্তদান করবেন?',
    'প্রতি দুই সেকেন্ডে বাংলাদেশে কারো না কারো রক্তের প্রয়োজন পড়ে। আপনার একটি ব্যাগ রক্ত কীভাবে তিনজন মানুষের জীবন বাঁচাতে পারে — পড়ুন বিস্তারিত।',
    E'বাংলাদেশে প্রতি বছর প্রায় ৭ লক্ষ ব্যাগ নিরাপদ রক্তের চাহিদা থাকে — অথচ স্বেচ্ছাসেবী ডোনারের সংখ্যা চাহিদার অর্ধেকেরও কম। ফলে থ্যালাসেমিয়া, ক্যান্সার, দুর্ঘটনা ও প্রসব-জটিলতায় হাজারো মানুষ প্রতিদিন রক্তের অপেক্ষায় থাকেন।\n\nএকটি গুরুত্বপূর্ণ বিষয়: একব্যাগ রক্ত আলাদা করে তিনটি উপাদানে রূপান্তরিত হয় — লোহিত কণিকা, প্লেটলেট, ও প্লাজমা। অর্থাৎ একজন ডোনারের একটি দান তিনজন রোগীর জীবন বাঁচাতে সক্ষম।\n\nনিয়মিত রক্তদানের কারণ:\n• থ্যালাসেমিয়া রোগীদের মাসে অন্তত একবার রক্ত প্রয়োজন হয়\n• প্রসূতি মা ও নবজাতকের জরুরি প্রয়োজনে সংরক্ষিত রক্ত জীবন বাঁচায়\n• দুর্ঘটনা ও সার্জারির রোগীদের জন্য তাৎক্ষণিক রক্ত অপরিহার্য\n• ক্যান্সার রোগীদের কেমোথেরাপির পর প্লেটলেট ট্রান্সফিউশন প্রায়ই দরকার পড়ে\n\nএকজন সুস্থ ডোনার প্রতি ৪ মাস অন্তর রক্তদান করলে বছরে ৩ বার = ৯ জনের জীবন বাঁচাতে পারেন।\n\nBloodSync-এর মাধ্যমে আপনি সরাসরি গ্রহীতার সাথে সংযোগ স্থাপন করতে পারেন — কোনো মধ্যস্থতা ছাড়াই, সম্পূর্ণ গোপনীয়তা সুরক্ষায়। এক ব্যাগ রক্ত — তিনটি জীবন। সিদ্ধান্ত আপনার।',
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&q=80',
    true
  ),
  (
    'রক্তদানের আগে ও পরে যা মেনে চলবেন',
    'নিরাপদ ও স্বাস্থ্যকর রক্তদানের জন্য কিছু সহজ নিয়ম। সঠিক প্রস্তুতি আপনার রক্তদানকে আরও কার্যকর ও নিরাপদ করবে।',
    E'রক্তদান একটি সহজ প্রক্রিয়া — তবে কিছু সাবধানতা মেনে চললে আপনি ও গ্রহীতা উভয়েই সবচেয়ে বেশি উপকৃত হবেন।\n\nরক্তদানের আগে:\n• আগের রাতে অন্তত ৭-৮ ঘণ্টা ঘুমান\n• দিনে অন্তত ৩-৪ গ্লাস পানি বা তরল পান করুন\n• রক্তদানের ৩-৪ ঘণ্টা আগে ভারী খাবার এড়িয়ে চলুন, কিন্তু খালি পেটে যাবেন না\n• আয়রন-সমৃদ্ধ খাবার (পালংশাক, ডাল, মাংস, খেজুর) আগের দিন থেকে গ্রহণ করুন\n• ধূমপান ও অ্যালকোহল ২৪ ঘণ্টা আগে থেকে এড়িয়ে চলুন\n• আপনার পরিচয়পত্র সঙ্গে রাখুন\n\nরক্তদানের সময়:\n• শান্ত থাকুন, ভয় পাবেন না — পুরো প্রক্রিয়ায় মাত্র ৮-১০ মিনিট লাগে\n• সূচ ফোটানোর সময় হাত শিথিল রাখুন\n• কোনো অস্বস্তি বোধ করলে সঙ্গে সঙ্গে কর্মীদের জানান\n\nরক্তদানের পরে:\n• অন্তত ১০-১৫ মিনিট বসে বিশ্রাম নিন, তারপর হালকা পানীয় ও খাবার গ্রহণ করুন\n• পরবর্তী ২৪ ঘণ্টা প্রচুর পানি পান করুন\n• ভারী ব্যায়াম, ভারী জিনিস তোলা বা সাঁতার এড়িয়ে চলুন ১২ ঘণ্টা\n• ব্যান্ডেজ অন্তত ৪ ঘণ্টা রাখুন\n• মাথা ঘুরালে শুয়ে পড়ুন, পা একটু উঁচু করুন\n\nএই সহজ নিয়মগুলো মেনে চললে আপনি প্রতি ৩-৪ মাস অন্তর সম্পূর্ণ নিরাপদে রক্তদান চালিয়ে যেতে পারবেন — এবং বছরের পর বছর হয়ে উঠবেন অসংখ্য জীবনের রক্ষক।',
    'https://images.unsplash.com/photo-1638272181967-7d3772a91265?w=1200&q=80',
    true
  )
) AS v(title, excerpt, content, cover_url, is_published)
WHERE NOT EXISTS (SELECT 1 FROM public.blogs);
