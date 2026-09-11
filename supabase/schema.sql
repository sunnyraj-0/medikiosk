-- ============================================================
-- MediKiosk.gov.in — Supabase setup
-- Run this once in the Supabase Dashboard → SQL Editor → Run.
-- Safe to run multiple times (idempotent).
-- ============================================================

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  department text not null default 'General Medicine',
  doctor text,
  appointment_date date,
  time_slot text,
  reason text,
  language text default 'English',
  status text not null default 'pending'
);

-- Lock the table down (RLS on by default in new tables, enforced here too)
alter table public.appointments enable row level security;

-- Allow the kiosk app (anon / publishable key) to INSERT bookings.
-- Drops first so the script never fails on a re-run.
drop policy if exists "allow anonymous appointment inserts" on public.appointments;
create policy "allow anonymous appointment inserts"
  on public.appointments
  for insert
  to anon
  with check (true);

-- Reads stay private — view bookings in the Dashboard → Table Editor.
-- Optional: let the kiosk also read back bookings later. Uncomment only if you
-- want the app itself to list appointments:
-- drop policy if exists "allow anonymous appointment reads" on public.appointments;
-- create policy "allow anonymous appointment reads"
--   on public.appointments
--   for select
--   to anon
--   using (true);