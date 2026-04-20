-- ============================================================================
-- BloodSync — initial schema for Supabase Postgres + Storage
-- Run this in the Supabase SQL Editor (or via psql) once, against your project.
-- It is idempotent: safe to re-run.
-- ============================================================================

-- ─── Tables ─────────────────────────────────────────────────────────────────

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

create index if not exists donors_blood_group_idx  on public.donors (blood_group);
create index if not exists donors_district_idx     on public.donors (district);
create index if not exists donors_willing_idx      on public.donors (is_willing_to_donate);

create table if not exists public.requests (
  id                    bigserial primary key,
  donor_id              bigint      not null references public.donors(id) on delete cascade,
  requester_identifier  text        not null,
  status                text        not null default 'pending',
  created_at            timestamptz not null default now()
);

create index if not exists requests_donor_id_idx on public.requests (donor_id);

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

-- ─── Row-Level Security ─────────────────────────────────────────────────────
-- Anonymous users can read & write donors/requests/verifications from the
-- BloodSync web app (no Supabase Auth in this MVP).

alter table public.donors                  enable row level security;
alter table public.requests                enable row level security;
alter table public.donations_verification  enable row level security;

drop policy if exists "Public read donors"           on public.donors;
drop policy if exists "Public write donors"          on public.donors;
drop policy if exists "Public update donors"         on public.donors;
drop policy if exists "Public read requests"         on public.requests;
drop policy if exists "Public write requests"        on public.requests;
drop policy if exists "Public read verifications"    on public.donations_verification;
drop policy if exists "Public write verifications"   on public.donations_verification;
drop policy if exists "Public update verifications"  on public.donations_verification;

create policy "Public read donors"           on public.donors                 for select using (true);
create policy "Public write donors"          on public.donors                 for insert with check (true);
create policy "Public update donors"         on public.donors                 for update using (true) with check (true);
create policy "Public read requests"         on public.requests               for select using (true);
create policy "Public write requests"        on public.requests               for insert with check (true);
create policy "Public read verifications"    on public.donations_verification for select using (true);
create policy "Public write verifications"   on public.donations_verification for insert with check (true);
create policy "Public update verifications"  on public.donations_verification for update using (true) with check (true);

-- ─── Storage bucket: verification-docs (public) ─────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-docs',
  'verification-docs',
  true,
  10485760,                           -- 10 MB
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: allow public uploads (insert) and reads from verification-docs.

drop policy if exists "Public read verification-docs"   on storage.objects;
drop policy if exists "Public upload verification-docs" on storage.objects;

create policy "Public read verification-docs"
  on storage.objects for select
  using (bucket_id = 'verification-docs');

create policy "Public upload verification-docs"
  on storage.objects for insert
  with check (bucket_id = 'verification-docs');
