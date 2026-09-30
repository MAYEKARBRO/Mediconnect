-- Create Events Table
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

-- Enable RLS for Events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies for Events
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON events USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Create Event Registrations Table
CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at timestamptz DEFAULT now(),
  status text DEFAULT 'confirmed', -- confirmed, cancelled, attended
  UNIQUE(event_id, user_id)
);

-- Enable RLS for Registrations
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Policies for Registrations
CREATE POLICY "Users can manage their own registrations" ON event_registrations USING (
  auth.uid() = user_id
);

CREATE POLICY "Admins can view all registrations" ON event_registrations FOR SELECT USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- View to easily see participant names (Admin usage)
-- Note: Supabase JS client can do join, but a view is also helpful sometimes. 
-- For this app, I'll rely on JS client joining `event_registrations` with `profiles`.
