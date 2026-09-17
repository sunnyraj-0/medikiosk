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
  token text,
  status text not null default 'pending'
);

-- OPD token for quick lookups (used by Prescription & Token screen)
create unique index if not exists appointments_token_idx
  on public.appointments (token) where token is not null;

-- ============================================================
-- Prescriptions — uploaded by doctors against an OPD token.
-- The patient views them via the kiosk "Prescription & Token" screen.
-- ============================================================
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  token text not null,
  doctor text not null,
  department text,
  prescription_date date not null default current_date,
  medicines jsonb not null default '[]',
  notes text
);

alter table public.prescriptions enable row level security;

-- Kiosk reads a prescription by token; doctors/staff insert them.
drop policy if exists "allow anonymous prescription reads" on public.prescriptions;
create policy "allow anonymous prescription reads"
  on public.prescriptions
  for select
  to anon
  using (true);

drop policy if exists "allow prescription inserts" on public.prescriptions;
create policy "allow prescription inserts"
  on public.prescriptions
  for insert
  to anon
  with check (true);

-- ============================================================
-- Medical records — documents scanned at the kiosk (AI-extracted).
-- Kiosk inserts (anon); reads stay private, view in Table Editor.
-- ============================================================
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  patient_name text,
  phone text,
  doc_type text,
  hospital text,
  doctor text,
  record_date text,
  diagnosis text,
  medicines jsonb not null default '[]',
  lab_values jsonb not null default '[]',
  notes text,
  raw_text text
);

alter table public.medical_records enable row level security;

drop policy if exists "allow anonymous medical record inserts" on public.medical_records;
create policy "allow anonymous medical record inserts"
  on public.medical_records
  for insert
  to anon
  with check (true);

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