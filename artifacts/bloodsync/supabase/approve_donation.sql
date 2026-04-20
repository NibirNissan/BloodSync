-- ════════════════════════════════════════════════════════════════════════
-- BloodSync — approve_donation RPC
-- Called from the Admin → Verification Queue "Approve" button.
-- Atomically:
--   1. Flips donations_verification.verification_status to 'verified'
--   2. Increments the donor's successful_donations counter
-- Run once in Supabase → SQL Editor → New query → Run.
-- Safe to re-run (CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.approve_donation(verification_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_donor_id    bigint;
  v_status      text;
begin
  -- Only admins may invoke this RPC.
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Only admins can approve donations';
  end if;

  select donor_id, verification_status
    into v_donor_id, v_status
    from public.donations_verification
   where id = verification_id;

  if v_donor_id is null then
    raise exception 'Verification % not found', verification_id;
  end if;

  if v_status = 'verified' then
    -- Idempotent: already approved — no-op.
    return;
  end if;

  update public.donations_verification
     set verification_status = 'verified'
   where id = verification_id;

  update public.donors
     set successful_donations = coalesce(successful_donations, 0) + 1
   where id = v_donor_id;
end;
$$;

-- Allow any authenticated client to invoke (the function itself enforces
-- the admin check internally).
grant execute on function public.approve_donation(bigint) to authenticated;
