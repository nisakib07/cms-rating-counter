-- Apply these changes to the Supabase SQL Editor
-- 1. Add status to ratings
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- 2. Add unique constraint for order_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_order_id ON ratings(order_id) WHERE order_id IS NOT NULL AND order_id != '';

-- 3. Add generic teams for managers
INSERT INTO teams (name, service_line) 
SELECT 'CMS Hub', 'CMS Hub' 
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'CMS Hub' AND service_line = 'CMS Hub');

INSERT INTO teams (name, service_line) 
SELECT 'CMS Endgame', 'CMS Endgame' 
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'CMS Endgame' AND service_line = 'CMS Endgame');

-- 4. Enable Public Insert for ratings
DROP POLICY IF EXISTS "Public insert ratings" ON ratings;
CREATE POLICY "Public insert ratings" ON ratings FOR INSERT TO anon, authenticated WITH CHECK (true);
