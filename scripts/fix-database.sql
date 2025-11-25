-- Fix database schema conflicts for production deployment
-- Run this in your database console or via psql

-- Drop problematic tables that have conflicts
DROP TABLE IF EXISTS sticker_collections CASCADE;

-- Recreate the table with correct schema
CREATE TABLE sticker_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    sticker_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    rarity VARCHAR(20) NOT NULL DEFAULT 'common',
    category VARCHAR(50) NOT NULL,
    image_url VARCHAR(255),
    is_glitter INTEGER NOT NULL DEFAULT 0,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_sticker_collections_child_id ON sticker_collections(child_id);
CREATE INDEX idx_sticker_collections_family_id ON sticker_collections(family_id);
CREATE INDEX idx_sticker_collections_sticker_id ON sticker_collections(sticker_id);

-- Ensure ranking_settings table exists
CREATE TABLE IF NOT EXISTS ranking_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    rankings_enabled INTEGER NOT NULL DEFAULT 1,
    family_ranking_enabled INTEGER NOT NULL DEFAULT 1,
    friends_ranking_enabled INTEGER NOT NULL DEFAULT 0,
    power_ranking_enabled INTEGER NOT NULL DEFAULT 1,
    show_positions INTEGER NOT NULL DEFAULT 1,
    show_negative_changes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create unique constraint for ranking_settings per family
CREATE UNIQUE INDEX idx_ranking_settings_family_id ON ranking_settings(family_id);

-- Verify friend_connections table structure
-- This should have composite primary key (child_id, friend_child_id)
-- and no regular id primary key

-- Check if we need to recreate friend_connections
DO $$
BEGIN
    -- Check if friend_connections exists and has wrong primary key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'friend_connections'
        AND constraint_type = 'PRIMARY KEY'
        AND constraint_name LIKE '%_pkey'
    ) THEN
        -- Drop and recreate friend_connections with correct schema
        DROP TABLE friend_connections CASCADE;

        CREATE TABLE friend_connections (
            id UUID DEFAULT gen_random_uuid(),
            child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
            friend_child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
            friend_code VARCHAR(16) NOT NULL UNIQUE,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            accepted_at TIMESTAMP WITH TIME ZONE,
            PRIMARY KEY (child_id, friend_child_id)
        );

        -- Create indexes
        CREATE INDEX idx_friend_connections_child_id ON friend_connections(child_id);
        CREATE INDEX idx_friend_connections_friend_child_id ON friend_connections(friend_child_id);
        CREATE INDEX idx_friend_connections_friend_code ON friend_connections(friend_code);
    END IF;
END $$;

-- Verify all tables exist and have correct structure
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'families', 'children', 'chores', 'rewards', 'reward_templates',
    'family_rewards', 'reward_redemptions', 'points_transactions',
    'good_causes', 'blog_posts', 'reviews', 'sessions',
    'verification_codes', 'coupons', 'coupon_usages',
    'badges', 'user_badges', 'avatar_items', 'avatar_customizations',
    'quest_chains', 'quest_progress', 'savings_goals', 'savings_history',
    'weekly_winner', 'team_chores', 'social_reactions',
    'automation_settings', 'notifications', 'virtual_pets',
    'pet_evolution_stages', 'sticker_collections', 'achievements',
    'family_leaderboards', 'daily_spins', 'family_feed',
    'rank_snapshots', 'friend_connections', 'ranking_settings',
    'weekly_champions', 'trusted_contacts', 'trusted_contact_verifications',
    'external_chore_requests', 'parent_approvals', 'wallets', 'wallet_transactions'
)
ORDER BY tablename;