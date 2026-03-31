-- Shadonis V1 Initial Schema
-- Run this in the Supabase SQL Editor or via Supabase CLI migrations

-- Users profile extending Supabase auth
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_time_unknown BOOLEAN DEFAULT FALSE,
  birth_city TEXT NOT NULL,
  birth_lat DECIMAL(10, 7) NOT NULL,
  birth_lng DECIMAL(10, 7) NOT NULL,
  birth_timezone TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Static interpretations (admin-managed content)
CREATE TABLE interpretations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  planet TEXT NOT NULL,
  angle TEXT NOT NULL,
  what_it_feels_like TEXT NOT NULL,
  best_use_cases TEXT NOT NULL,
  watch_outs TEXT NOT NULL,
  short_theme TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(planet, angle)
);

-- User feedback
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feels_accurate BOOLEAN,
  comment TEXT,
  screen_context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage metrics
CREATE TABLE usage_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX idx_usage_events_type ON usage_events(event_type);
CREATE INDEX idx_interpretations_planet_angle ON interpretations(planet, angle);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Interpretations: everyone can read, only service role can modify
CREATE POLICY "Anyone can read interpretations"
  ON interpretations FOR SELECT
  TO authenticated
  USING (true);

-- Feedback: users can insert their own, read their own
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Usage events: users can insert their own
CREATE POLICY "Users can insert own events"
  ON usage_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interpretations_updated_at
  BEFORE UPDATE ON interpretations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
