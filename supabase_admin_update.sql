-- Add Hospital Details to Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hospital_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hospital_address text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number text;

-- Ensure RLS allows updates
-- 'Users can update own profile' policy usually exists.

-- Create Staff Table if not exists
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  role text NOT NULL,
  employee_id text,
  contact_number text,
  is_active boolean DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- RLS for Staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policy to avoid conflict
DROP POLICY IF EXISTS "Admins can manage staff" ON staff;

-- Re-create policy
CREATE POLICY "Admins can manage staff" ON staff USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Add 'status' column to doctor_profiles if not exists
ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';
