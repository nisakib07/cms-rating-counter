-- Fix: Allow re-submission after a rating with the same order_id + member_id
-- has been deleted or rejected.
--
-- The old index blocked ALL inserts for a given (order_id, member_id) pair,
-- even if the previous row was rejected. The new index only applies to
-- non-rejected ratings, allowing users to re-submit after rejection.

-- Drop the old unique index
DROP INDEX IF EXISTS idx_ratings_order_member;

-- Recreate with an additional filter that excludes rejected ratings
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_order_member
  ON ratings(order_id, member_id)
  WHERE order_id IS NOT NULL
    AND order_id != ''
    AND status != 'rejected';
