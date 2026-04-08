-- Drop the old single-column unique index that restricted one order per system
DROP INDEX IF EXISTS idx_ratings_order_id;

-- Create the new composite unique index restricting one order ID per *member*
-- Excludes rejected ratings so re-submissions are allowed after rejection
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_order_member ON ratings(order_id, member_id) WHERE order_id IS NOT NULL AND order_id != '' AND status != 'rejected';

