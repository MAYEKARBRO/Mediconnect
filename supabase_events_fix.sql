-- 1. Ensure Tables Exist First
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  location text,
  image_url text,
  organizer text DEFAULT 'MediConnect Administration',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at timestamptz DEFAULT now(),
  status text DEFAULT 'confirmed',
  UNIQUE(event_id, user_id)
);

-- 2. Drop conflicting policies (Now safe because tables exist)
DROP POLICY IF EXISTS "Public read events" ON events;
DROP POLICY IF EXISTS "Admins can manage events" ON events;
DROP POLICY IF EXISTS "Users can manage their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can register" ON event_registrations;
DROP POLICY IF EXISTS "Users can view own" ON event_registrations;
DROP POLICY IF EXISTS "Users can cancel" ON event_registrations;
DROP POLICY IF EXISTS "Admins can view all" ON event_registrations;

-- 3. Context: Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 4. Re-create Policies

-- EVENTS POLICIES
-- Public Read Access (Patients, Doctors, Admins)
CREATE POLICY "Public read events" ON events
  FOR SELECT
  USING (true);

-- Admin Write Access (Insert, Update, Delete)
CREATE POLICY "Admins can manage events" ON events
  FOR ALL
  USING (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- EVENT REGISTRATIONS POLICIES
-- Users can register (Insert)
CREATE POLICY "Users can register" ON event_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own registrations
CREATE POLICY "Users can view own" ON event_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can cancel (Delete) their own
CREATE POLICY "Users can cancel" ON event_registrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all registrations
CREATE POLICY "Admins can view all" ON event_registrations
  FOR SELECT
  USING (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
