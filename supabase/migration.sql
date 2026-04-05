-- =============================================
-- Team Rating Counter - Database Migration
-- Run this in your Supabase SQL Editor
-- =============================================

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_line TEXT NOT NULL CHECK (service_line IN ('CMS Hub', 'CMS Endgame')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'Developer',
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  profile_image TEXT,
  joined_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  rating_value INTEGER DEFAULT 5 CHECK (rating_value BETWEEN 1 AND 5),
  order_id TEXT,
  client_name TEXT,
  review_text TEXT,
  screenshot_url TEXT,
  date_received DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_ratings_member_id ON ratings(member_id);
CREATE INDEX IF NOT EXISTS idx_ratings_team_id ON ratings(team_id);
CREATE INDEX IF NOT EXISTS idx_members_team_id ON members(team_id);
CREATE INDEX IF NOT EXISTS idx_ratings_date_received ON ratings(date_received);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_order_id ON ratings(order_id) WHERE order_id IS NOT NULL AND order_id != '';

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view stats)
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read members" ON members FOR SELECT USING (true);
CREATE POLICY "Public read ratings" ON ratings FOR SELECT USING (true);

-- Public insert access (for submit page)
CREATE POLICY "Public insert ratings" ON ratings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admin write access (authenticated users only)
CREATE POLICY "Admin insert teams" ON teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update teams" ON teams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete teams" ON teams FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admin insert members" ON members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update members" ON members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete members" ON members FOR DELETE TO authenticated USING (true);

-- Handled by Public insert ratings now, but we can keep admin update/delete
CREATE POLICY "Admin update ratings" ON ratings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete ratings" ON ratings FOR DELETE TO authenticated USING (true);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Seed Data - Predefined Teams
-- =============================================
INSERT INTO teams (name, service_line) VALUES
  ('Shopify Shinobi', 'CMS Hub'),
  ('Liquid Sensei', 'CMS Hub'),
  ('Hydra Forge', 'CMS Hub'),
  ('DevX Studio', 'CMS Hub'),
  ('Team Shogun', 'CMS Hub'),
  ('TeamCodeX', 'CMS Endgame'),
  ('EleSquad', 'CMS Endgame'),
  ('DevWizards', 'CMS Endgame'),
  ('Team ElenBurg', 'CMS Endgame');
