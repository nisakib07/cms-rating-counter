-- Add a 'color' column to the teams table, defaulting to the generic blue
ALTER TABLE teams ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

-- You can manually assign some initial fun colors to existing teams here if you want:
-- UPDATE teams SET color = '#10b981' WHERE service_line = 'CMS Hub';
-- UPDATE teams SET color = '#8b5cf6' WHERE name = 'Some Specific Team';
