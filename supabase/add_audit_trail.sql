-- =============================================
-- Rating Audit Trail Migration
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Add approval tracking columns to ratings table
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 2. Create audit log table for edit history
CREATE TABLE IF NOT EXISTS rating_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID REFERENCES ratings(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'edited', 'approved', 'rejected', 'status_changed')),
  changed_by TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index for fast lookup by rating_id
CREATE INDEX IF NOT EXISTS idx_audit_log_rating_id ON rating_audit_log(rating_id);

-- 4. RLS policies for audit log
ALTER TABLE rating_audit_log ENABLE ROW LEVEL SECURITY;

-- Anyone can read audit logs (needed for info panel)
CREATE POLICY "Public read audit_log" ON rating_audit_log FOR SELECT USING (true);

-- Only authenticated users can insert audit logs
CREATE POLICY "Auth insert audit_log" ON rating_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- Allow anon to insert audit logs (for public submit page)
CREATE POLICY "Anon insert audit_log" ON rating_audit_log FOR INSERT TO anon WITH CHECK (true);
