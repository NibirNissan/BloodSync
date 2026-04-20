-- ════════════════════════════════════════════════════════════════════════
-- BloodSync — core schema
-- Run this ONCE in Supabase → SQL Editor → New query → Run.
-- After it succeeds, run admin_rls.sql, then blogs.sql.
-- ════════════════════════════════════════════════════════════════════════

-- ── PROFILES ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'normal' check (role in ('normal','donor','admin')),
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'normal')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "profiles read self"   on public.profiles;
drop policy if exists "profiles update self" on public.profiles;
drop policy if exists "profiles insert self" on public.profiles;

create policy "profiles read self"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles update self"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles insert self"
  on public.profiles for insert
  with check (auth.uid() = id);


-- ── DONORS ──────────────────────────────────────────────────────────────
create table if not exists public.donors (
  id                       bigserial primary key,
  user_uid                 uuid references auth.users(id) on delete set null,
  name                     text not null,
  blood_group              text not null,
  division                 text not null,
  district                 text not null,
  whatsapp_number          text not null,
  smoker                   boolean not null default false,
  last_donation_date       date,
  is_willing_to_donate     boolean not null default true,
  total_requests_received  integer not null default 0,
  successful_donations     integer not null default 0,
  created_at               timestamptz not null default now()
);

alter table public.donors enable row level security;

drop policy if exists "donors public read"   on public.donors;
drop policy if exists "donors insert self"   on public.donors;
drop policy if exists "donors update self"   on public.donors;

create policy "donors public read"
  on public.donors for select using (true);

create policy "donors insert self"
  on public.donors for insert
  with check (auth.uid() is not null);

create policy "donors update self"
  on public.donors for update
  using (auth.uid() = user_uid);


-- ── REQUESTS ────────────────────────────────────────────────────────────
create table if not exists public.requests (
  id              bigserial primary key,
  donor_id        bigint references public.donors(id) on delete cascade,
  requester_uid   uuid references auth.users(id) on delete set null,
  status          text not null default 'pending'
                  check (status in ('pending','fulfilled','cancelled','completed')),
  created_at      timestamptz not null default now()
);

alter table public.requests enable row level security;

drop policy if exists "requests read own"    on public.requests;
drop policy if exists "requests insert auth" on public.requests;

create policy "requests read own"
  on public.requests for select
  using (auth.uid() = requester_uid);

create policy "requests insert auth"
  on public.requests for insert
  with check (auth.uid() = requester_uid);


-- ── DONATION VERIFICATIONS ──────────────────────────────────────────────
create table if not exists public.donation_verifications (
  id                    bigserial primary key,
  donor_id              bigint references public.donors(id) on delete cascade,
  recipient_details     text,
  proof_document_url    text,
  verification_status   text not null default 'pending'
                        check (verification_status in ('pending','verified','rejected')),
  created_at            timestamptz not null default now()
);

alter table public.donation_verifications enable row level security;

drop policy if exists "verifications insert auth" on public.donation_verifications;
drop policy if exists "verifications read own"    on public.donation_verifications;

create policy "verifications insert auth"
  on public.donation_verifications for insert
  with check (auth.uid() is not null);

create policy "verifications read own"
  on public.donation_verifications for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.donors d
      where d.id = donor_id and d.user_uid = auth.uid()
    )
  );
