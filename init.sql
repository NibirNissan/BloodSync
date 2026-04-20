-- ============================================================================
-- BloodSync — initial schema for Supabase Postgres + Storage + Auth
-- Run this in the Supabase SQL Editor (or via psql) once, against your project.
-- It is idempotent: safe to re-run. After adding the new auth columns it will
-- ALTER existing tables in place without dropping data.
--
-- IMPORTANT (Supabase project setting):
--   Auth → Providers → Email → DISABLE "Confirm email"
--   so signups can log in immediately. (Production should re-enable this.)
-- ============================================================================

-- ─── profiles (1 row per auth.users user, holds the role) ───────────────────

create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text        not null default 'normal'
              check (role in ('normal','donor','admin')),
  created_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- ─── donors ─────────────────────────────────────────────────────────────────

create table if not exists public.donors (
  id                       bigserial primary key,
  name                     text        not null,
  blood_group              text        not null,
  district                 text        not null,
  whatsapp_number          text        not null,
  smoker                   boolean     not null default false,
  last_donation_date       text,
  is_willing_to_donate     boolean     not null default true,
  total_requests_received  integer     not null default 0,
  successful_donations     integer     not null default 0,
  created_at               timestamptz not null default now()
);

-- Add the auth link if it doesn't already exist.
alter table public.donors
  add column if not exists auth_uid uuid references auth.users(id) on delete set null;

create unique index if not exists donors_auth_uid_uidx on public.donors (auth_uid);
create index        if not exists donors_blood_group_idx on public.donors (blood_group);
create index        if not exists donors_district_idx    on public.donors (district);
create index        if not exists donors_willing_idx     on public.donors (is_willing_to_donate);

-- ─── requests ───────────────────────────────────────────────────────────────

create table if not exists public.requests (
  id                    bigserial primary key,
  donor_id              bigint      not null references public.donors(id) on delete cascade,
  requester_identifier  text        not null,
  status                text        not null default 'pending',
  created_at            timestamptz not null default now()
);

alter table public.requests
  add column if not exists requester_uid uuid references auth.users(id) on delete set null;

create index if not exists requests_donor_id_idx      on public.requests (donor_id);
create index if not exists requests_requester_uid_idx on public.requests (requester_uid);

-- ─── donations_verification ─────────────────────────────────────────────────

create table if not exists public.donations_verification (
  id                    bigserial primary key,
  donor_id              bigint      not null references public.donors(id) on delete cascade,
  recipient_details     text        not null,
  proof_document_url    text,
  verification_status   text        not null default 'pending',
  created_at            timestamptz not null default now()
);

create index if not exists donations_verification_donor_id_idx on public.donations_verification (donor_id);
create index if not exists donations_verification_status_idx   on public.donations_verification (verification_status);

-- ─── Row-Level Security (permissive MVP — anon + authenticated allowed) ────

alter table public.profiles                enable row level security;
alter table public.donors                  enable row level security;
alter table public.requests                enable row level security;
alter table public.donations_verification  enable row level security;

drop policy if exists "Public read profiles"            on public.profiles;
drop policy if exists "Public write profiles"           on public.profiles;
drop policy if exists "Public update profiles"          on public.profiles;
drop policy if exists "Public read donors"              on public.donors;
drop policy if exists "Public write donors"             on public.donors;
drop policy if exists "Public update donors"            on public.donors;
drop policy if exists "Public read requests"            on public.requests;
drop policy if exists "Public write requests"           on public.requests;
drop policy if exists "Public read verifications"       on public.donations_verification;
drop policy if exists "Public write verifications"      on public.donations_verification;
drop policy if exists "Public update verifications"     on public.donations_verification;

create policy "Public read profiles"           on public.profiles               for select using (true);
create policy "Public write profiles"          on public.profiles               for insert with check (true);
create policy "Public update profiles"         on public.profiles               for update using (true) with check (true);
create policy "Public read donors"             on public.donors                 for select using (true);
create policy "Public write donors"            on public.donors                 for insert with check (true);
create policy "Public update donors"           on public.donors                 for update using (true) with check (true);
create policy "Public read requests"           on public.requests               for select using (true);
create policy "Public write requests"          on public.requests               for insert with check (true);
create policy "Public read verifications"      on public.donations_verification for select using (true);
create policy "Public write verifications"     on public.donations_verification for insert with check (true);
create policy "Public update verifications"    on public.donations_verification for update using (true) with check (true);

-- ─── Storage bucket: verification-docs (public) ─────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-docs',
  'verification-docs',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read verification-docs"   on storage.objects;
drop policy if exists "Public upload verification-docs" on storage.objects;

create policy "Public read verification-docs"
  on storage.objects for select
  using (bucket_id = 'verification-docs');

create policy "Public upload verification-docs"
  on storage.objects for insert
  with check (bucket_id = 'verification-docs');

-- ─── Atomic, idempotent verification actions ─────────────────────────────────
-- Approving from the client used to do read-then-write on successful_donations,
-- which is racy under concurrent admin actions and can overcount. These RPCs
-- run server-side in a single transaction with a `pending` guard, so a row
-- can only ever be approved/rejected once.

create or replace function public.approve_verification(p_id integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_donor int;
begin
  update public.donations_verification
    set verification_status = 'verified'
    where id = p_id and verification_status = 'pending'
    returning donor_id into v_donor;

  if v_donor is not null then
    update public.donors
      set successful_donations = coalesce(successful_donations, 0) + 1
      where id = v_donor;
  end if;
end;
$$;

create or replace function public.reject_verification(p_id integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.donations_verification
    set verification_status = 'rejected'
    where id = p_id and verification_status = 'pending';
end;
$$;

grant execute on function public.approve_verification(integer) to anon, authenticated;
grant execute on function public.reject_verification(integer)  to anon, authenticated;

-- ─── How to make a Super Admin ──────────────────────────────────────────────
-- After a user signs up, upgrade them by running:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
