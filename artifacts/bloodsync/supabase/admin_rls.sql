-- ════════════════════════════════════════════════════════════════════════
-- BloodSync — Admin RLS bypass
-- Grants users with profiles.role = 'admin' full read/write access to
-- every domain table. Run this AFTER init.sql and blogs.sql.
-- Re-run safely any time — every policy is dropped and recreated.
-- ════════════════════════════════════════════════════════════════════════

-- Helper: fast `is_admin()` check used in every policy below.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── PROFILES ────────────────────────────────────────────────────────────
drop policy if exists "profiles admin all" on public.profiles;
create policy "profiles admin all"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── DONORS ──────────────────────────────────────────────────────────────
drop policy if exists "donors admin all" on public.donors;
create policy "donors admin all"
  on public.donors for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── REQUESTS ────────────────────────────────────────────────────────────
drop policy if exists "requests admin all" on public.requests;
create policy "requests admin all"
  on public.requests for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── DONATION VERIFICATIONS ──────────────────────────────────────────────
drop policy if exists "verifications admin all" on public.donation_verifications;
create policy "verifications admin all"
  on public.donation_verifications for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── BLOGS (already has admin policy in blogs.sql, but re-asserted here) ─
drop policy if exists "blogs admin all" on public.blogs;
create policy "blogs admin all"
  on public.blogs for all
  using (public.is_admin())
  with check (public.is_admin());
