-- ==============================================================================
-- MediConnect Hospital - Doctor Social & Clinical Collaboration Schema
-- ==============================================================================

-- 1. Create table for doctor hospital affiliations
CREATE TABLE IF NOT EXISTS public.doctor_hospital_affiliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hospital_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hospital_name text NOT NULL,
  department text,
  status text CHECK (status IN ('pending', 'approved', 'rejected', 'terminated')) DEFAULT 'pending',
  message text,
  visiting_hours text,
  requested_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, hospital_id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.doctor_hospital_affiliations ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Everyone can read approved affiliations (so patients can see doctor affiliations)
CREATE POLICY "Anyone can view approved affiliations" ON public.doctor_hospital_affiliations
  FOR SELECT
  USING (true);

-- Doctors can insert their own affiliation requests
CREATE POLICY "Doctors can request affiliation" ON public.doctor_hospital_affiliations
  FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

-- Doctors can update or withdraw their own requests
CREATE POLICY "Doctors can manage own requests" ON public.doctor_hospital_affiliations
  FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete own requests" ON public.doctor_hospital_affiliations
  FOR DELETE
  USING (auth.uid() = doctor_id);

-- Hospital Admins can update affiliation status (approve/reject)
CREATE POLICY "Hospital admins can update affiliation status" ON public.doctor_hospital_affiliations
  FOR UPDATE
  USING (auth.uid() = hospital_id);

-- 4. Extend profiles table with hospital details if not already present
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hospital_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hospital_address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bed_capacity integer DEFAULT 150;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS departments text[] DEFAULT ARRAY['General Medicine', 'Emergency Care', 'Surgery'];
