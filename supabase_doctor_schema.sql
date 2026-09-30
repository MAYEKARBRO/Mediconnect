-- Create a table for patients managed by doctors
create table public.doctor_patients (
  id uuid default gen_random_uuid() primary key,
  doctor_id uuid references auth.users not null,
  name text not null,
  email text,
  phone text,
  height numeric,
  weight numeric,
  status text check (status in ('current', 'past')) default 'current',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for doctor_patients
alter table public.doctor_patients enable row level security;

-- Policy: Doctors can manage their own patients
create policy "Doctors can view their own patients" on public.doctor_patients
  for select using (auth.uid() = doctor_id);

create policy "Doctors can insert their own patients" on public.doctor_patients
  for insert with check (auth.uid() = doctor_id);

create policy "Doctors can update their own patients" on public.doctor_patients
  for update using (auth.uid() = doctor_id);

-- Create a table for medical records (diagnosis, prescriptions)
create table public.patient_records (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.doctor_patients on delete cascade not null,
  doctor_id uuid references auth.users not null,
  diagnosis text,
  prescription_url text,
  visit_date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for records
alter table public.patient_records enable row level security;

create policy "Doctors can manage patient records" on public.patient_records
  for all using (auth.uid() = doctor_id);

-- Create a table for appointments
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  doctor_id uuid references auth.users not null,
  patient_id uuid references public.doctor_patients, -- Optional, could be a new walk-in
  patient_name text, -- Fallback if not linked
  appointment_date timestamp with time zone not null,
  type text,
  status text default 'scheduled',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for appointments
alter table public.appointments enable row level security;

create policy "Doctors can manage appointments" on public.appointments
  for all using (auth.uid() = doctor_id);

-- Helper to create a storage bucket for prescriptions (if using Supabase Storage)
-- Note: This often requires SQL Editor rights or Dashboard creation, but putting here for reference.
insert into storage.buckets (id, name, public) values ('prescriptions', 'prescriptions', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload prescriptions" on storage.objects
  for insert with check (bucket_id = 'prescriptions' and auth.role() = 'authenticated');
  
create policy "Users can view prescriptions" on storage.objects
  for select using (bucket_id = 'prescriptions');
