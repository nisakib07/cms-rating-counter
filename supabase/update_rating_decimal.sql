-- =============================================
-- Update rating_value to support decimal ratings
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Drop the old integer constraint
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_rating_value_check;

-- 2. Change column type from INTEGER to NUMERIC(2,1) for decimal support
ALTER TABLE ratings ALTER COLUMN rating_value TYPE NUMERIC(2,1) USING rating_value::NUMERIC(2,1);

-- 3. Add new constraint allowing 1.0 to 5.0
ALTER TABLE ratings ADD CONSTRAINT ratings_rating_value_check CHECK (rating_value BETWEEN 1.0 AND 5.0);

-- 4. Update default
ALTER TABLE ratings ALTER COLUMN rating_value SET DEFAULT 5.0;
