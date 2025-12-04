-- Performance indexes migration
-- These indexes improve query performance for common operations

-- Index for families email lookup (authentication)
CREATE INDEX IF NOT EXISTS idx_families_email ON families(email);

-- Index for children by family (loading family data)
CREATE INDEX IF NOT EXISTS idx_children_family_id ON children(family_id);

-- Index for chores by family (loading family chores)
CREATE INDEX IF NOT EXISTS idx_chores_family_id ON chores(family_id);

-- Index for chores by status (filtering available chores)
CREATE INDEX IF NOT EXISTS idx_chores_status ON chores(status);

-- Composite index for chores by family and status
CREATE INDEX IF NOT EXISTS idx_chores_family_status ON chores(family_id, status);

-- Index for rewards by family
CREATE INDEX IF NOT EXISTS idx_rewards_family_id ON rewards(family_id);

-- Index for sessions by token (session lookup)
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Index for sessions by family (finding user sessions)
CREATE INDEX IF NOT EXISTS idx_sessions_family_id ON sessions(family_id);

-- Index for sessions expiry (cleanup expired sessions)
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Index for points transactions by child (history lookup)
CREATE INDEX IF NOT EXISTS idx_points_transactions_child_id ON points_transactions(child_id);

-- Index for points transactions by date (recent transactions)
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at DESC);

-- Index for verification codes email lookup
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);

-- Index for verification codes expiry cleanup
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Index for family rewards by family
CREATE INDEX IF NOT EXISTS idx_family_rewards_family_id ON family_rewards(family_id);

-- Index for reward redemptions by child
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_child_id ON reward_redemptions(child_id);

-- Index for trusted contacts by family
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_family_id ON trusted_contacts(family_id);

-- Index for external chore requests by family
CREATE INDEX IF NOT EXISTS idx_external_chore_requests_family_id ON external_chore_requests(family_id);

-- Index for coach messages by child
CREATE INDEX IF NOT EXISTS idx_coach_messages_child_id ON coach_messages(child_id);

-- Index for blog posts by status and published date
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC);

-- Index for coupons by code (validation lookup)
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- Composite index for chore templates (category and active)
CREATE INDEX IF NOT EXISTS idx_chore_templates_category_active ON chore_templates(category_id, is_active);
