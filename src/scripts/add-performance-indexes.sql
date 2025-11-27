-- Performance Indexes for KlusjesKoning
-- Run this script to add indexes that improve query performance

-- ==========================================
-- FAMILIES TABLE
-- ==========================================
-- Index for login by email (authenticateFamily)
CREATE INDEX IF NOT EXISTS idx_families_email ON families(email);

-- Index for lookup by family code (getFamilyByCode)
CREATE INDEX IF NOT EXISTS idx_families_family_code ON families(family_code);

-- ==========================================
-- CHILDREN TABLE
-- ==========================================
-- Index for fetching children by family (most common query)
CREATE INDEX IF NOT EXISTS idx_children_family_id ON children(family_id);

-- Composite index for child login verification
CREATE INDEX IF NOT EXISTS idx_children_family_pin ON children(family_id, pin);

-- ==========================================
-- CHORES TABLE
-- ==========================================
-- Index for fetching chores by family
CREATE INDEX IF NOT EXISTS idx_chores_family_id ON chores(family_id);

-- Index for filtering by status (submitted, approved, etc.)
CREATE INDEX IF NOT EXISTS idx_chores_status ON chores(status);

-- Composite index for family + status queries
CREATE INDEX IF NOT EXISTS idx_chores_family_status ON chores(family_id, status);

-- Index for submitted chores by child
CREATE INDEX IF NOT EXISTS idx_chores_submitted_by ON chores(submitted_by_child_id) WHERE submitted_by_child_id IS NOT NULL;

-- ==========================================
-- CHORE ASSIGNMENTS TABLE
-- ==========================================
-- Index for fetching assignments by chore
CREATE INDEX IF NOT EXISTS idx_chore_assignments_chore_id ON chore_assignments(chore_id);

-- Index for fetching assignments by child
CREATE INDEX IF NOT EXISTS idx_chore_assignments_child_id ON chore_assignments(child_id);

-- Composite index for family queries (via foreign key)
CREATE INDEX IF NOT EXISTS idx_chore_assignments_chore_child ON chore_assignments(chore_id, child_id);

-- ==========================================
-- REWARDS TABLE
-- ==========================================
-- Index for fetching rewards by family
CREATE INDEX IF NOT EXISTS idx_rewards_family_id ON rewards(family_id);

-- Index for filtering by reward type
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(type);

-- ==========================================
-- REWARD ASSIGNMENTS TABLE
-- ==========================================
-- Index for fetching reward assignments by reward
CREATE INDEX IF NOT EXISTS idx_reward_assignments_reward_id ON reward_assignments(reward_id);

-- Index for fetching reward assignments by child
CREATE INDEX IF NOT EXISTS idx_reward_assignments_child_id ON reward_assignments(child_id);

-- ==========================================
-- PENDING REWARDS TABLE
-- ==========================================
-- Index for fetching pending rewards by family
CREATE INDEX IF NOT EXISTS idx_pending_rewards_family_id ON pending_rewards(family_id);

-- Index for fetching pending rewards by child
CREATE INDEX IF NOT EXISTS idx_pending_rewards_child_id ON pending_rewards(child_id);

-- Index for fetching pending rewards by reward
CREATE INDEX IF NOT EXISTS idx_pending_rewards_reward_id ON pending_rewards(reward_id);

-- Index for sorting by redemption date
CREATE INDEX IF NOT EXISTS idx_pending_rewards_redeemed_at ON pending_rewards(redeemed_at DESC);

-- ==========================================
-- SESSIONS TABLE
-- ==========================================
-- Index for session lookup by token (most common query)
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Index for session cleanup by expiration
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Index for fetching sessions by family
CREATE INDEX IF NOT EXISTS idx_sessions_family_id ON sessions(family_id);

-- ==========================================
-- POINTS TRANSACTIONS TABLE (if exists)
-- ==========================================
-- Index for fetching transactions by family + child
CREATE INDEX IF NOT EXISTS idx_points_transactions_family_child ON points_transactions(family_id, child_id);

-- Index for sorting by date
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at DESC);

-- Index for filtering by transaction type
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(type);

-- ==========================================
-- VERIFICATION CODES TABLE (if exists)
-- ==========================================
-- Index for code verification
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_purpose ON verification_codes(email, purpose);

-- Index for cleanup of expired codes
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- ==========================================
-- ANALYZE TABLES
-- ==========================================
-- Update statistics for query planner
ANALYZE families;
ANALYZE children;
ANALYZE chores;
ANALYZE chore_assignments;
ANALYZE rewards;
ANALYZE reward_assignments;
ANALYZE pending_rewards;
ANALYZE sessions;

-- If these tables exist, analyze them too
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'points_transactions') THEN
    ANALYZE points_transactions;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_codes') THEN
    ANALYZE verification_codes;
  END IF;
END $$;

-- ==========================================
-- VERIFICATION
-- ==========================================
-- Check which indexes were created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE 'idx_families%'
    OR indexname LIKE 'idx_children%'
    OR indexname LIKE 'idx_chores%'
    OR indexname LIKE 'idx_rewards%'
    OR indexname LIKE 'idx_sessions%'
    OR indexname LIKE 'idx_pending%'
    OR indexname LIKE 'idx_points%'
    OR indexname LIKE 'idx_verification%'
  )
ORDER BY tablename, indexname;
