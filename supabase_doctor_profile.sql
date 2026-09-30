-- Create a table for doctor profiles
create table public.doctor_profiles (
  id uuid references auth.users on delete cascade primary key,
  specialization text,
  experience_years integer,
  affiliated_hospitals text[], -- Array of strings for hospital names
  license_number text,
  license_image_url text,
  biography text,
  cases_handled integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.doctor_profiles enable row level security;

-- Policies
create policy "Doctors can manage their own profile" on public.doctor_profiles
  for all using (auth.uid() = id);

create policy "Anyone can view doctor profiles" on public.doctor_profiles
  for select using (true);

-- Storage bucket for license images (optional, if you want to support upload)
insert into storage.buckets (id, name, public) values ('doctor-assets', 'doctor-assets', true)
on conflict (id) do nothing;

create policy "Doctors can upload assets" on storage.objects
  for insert with check (bucket_id = 'doctor-assets' and auth.uid() = owner);

create policy "Public can view doctor assets" on storage.objects
  for select using (bucket_id = 'doctor-assets');
