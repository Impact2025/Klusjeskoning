-- Add gamification columns to existing database
-- Run this script to add the new gamification features to an existing database

-- Add XP columns to children table
ALTER TABLE children ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;
ALTER TABLE children ADD COLUMN IF NOT EXISTS total_xp_ever integer DEFAULT 0;

-- Add quest columns to chores table
ALTER TABLE chores ADD COLUMN IF NOT EXISTS xp_reward integer DEFAULT 0;
ALTER TABLE chores ADD COLUMN IF NOT EXISTS quest_chain_id uuid;
ALTER TABLE chores ADD COLUMN IF NOT EXISTS is_main_quest integer DEFAULT 0;
ALTER TABLE chores ADD COLUMN IF NOT EXISTS chain_order integer;

-- Add automation columns to chores table
ALTER TABLE chores ADD COLUMN IF NOT EXISTS recurrence_type varchar(20) DEFAULT 'once';
ALTER TABLE chores ADD COLUMN IF NOT EXISTS recurrence_days integer[] DEFAULT '{}';
ALTER TABLE chores ADD COLUMN IF NOT EXISTS is_template integer DEFAULT 0;
ALTER TABLE chores ADD COLUMN IF NOT EXISTS template_id uuid;
ALTER TABLE chores ADD COLUMN IF NOT EXISTS next_due_date timestamp with time zone;

-- Create new enums
CREATE TYPE IF NOT EXISTS avatar_item_type AS ENUM ('accessory', 'outfit', 'background');
CREATE TYPE IF NOT EXISTS badge_type AS ENUM ('achievement', 'level', 'quest', 'social');
CREATE TYPE IF NOT EXISTS rarity AS ENUM ('common', 'rare', 'epic', 'legendary');

-- Create new tables
CREATE TABLE IF NOT EXISTS badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    description text NOT NULL,
    icon varchar(50) NOT NULL,
    type badge_type NOT NULL,
    criteria text,
    xp_reward integer DEFAULT 0 NOT NULL,
    rarity rarity DEFAULT 'common' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS avatar_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    type avatar_item_type NOT NULL,
    xp_required integer DEFAULT 0 NOT NULL,
    image_url text,
    rarity rarity DEFAULT 'common' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS avatar_customizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    item_id uuid NOT NULL REFERENCES avatar_items(id) ON DELETE CASCADE,
    is_equipped integer DEFAULT 0 NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS quest_chains (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    description text,
    reward_badge_id uuid REFERENCES badges(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS quest_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    quest_chain_id uuid NOT NULL REFERENCES quest_chains(id) ON DELETE CASCADE,
    completed_steps text[] DEFAULT '{}' NOT NULL,
    completed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS savings_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    item_name varchar(255) NOT NULL,
    target_amount integer NOT NULL,
    current_amount integer DEFAULT 0 NOT NULL,
    image_url text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS savings_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    amount integer NOT NULL,
    description varchar(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS weekly_winner (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    week_start timestamp with time zone NOT NULL,
    criteria varchar(100) NOT NULL,
    points integer NOT NULL,
    selected_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS team_chores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    description text,
    participating_children uuid[] NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS social_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    to_child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    reaction_type varchar(50) NOT NULL,
    related_chore_id uuid REFERENCES chores(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraints for quest chains
ALTER TABLE chores ADD CONSTRAINT IF NOT EXISTS chores_quest_chain_id_fkey
    FOREIGN KEY (quest_chain_id) REFERENCES quest_chains(id) ON DELETE SET NULL;

-- Insert some sample data
INSERT INTO avatar_items (name, type, xp_required, rarity) VALUES
    ('Honkbalpet', 'accessory', 25, 'common'),
    ('Kroon', 'accessory', 100, 'rare'),
    ('Zonnebril', 'accessory', 50, 'common'),
    ('Tovenaarshoed', 'accessory', 200, 'epic'),
    ('Supheld Kostuum', 'outfit', 75, 'rare'),
    ('Prinses Jurk', 'outfit', 150, 'epic'),
    ('Astronaut Pak', 'outfit', 300, 'legendary'),
    ('Kasteel Achtergrond', 'background', 50, 'common'),
    ('Ruimte Achtergrond', 'background', 150, 'rare'),
    ('Ocean Achtergrond', 'background', 250, 'epic')
ON CONFLICT DO NOTHING;

INSERT INTO badges (name, description, icon, type, xp_reward, rarity) VALUES
    ('Eerste Klusje', 'Je eerste klusje voltooid!', '🎉', 'achievement', 10, 'common'),
    ('Quest Master', 'Alle quests in een keten voltooid', '🏆', 'quest', 50, 'rare'),
    ('Level 5', 'Bereikt level 5!', '⭐', 'level', 25, 'common'),
    ('Level 10', 'Bereikt level 10!', '🌟', 'level', 50, 'rare'),
    ('Held van de Week', 'Deze week de meeste punten verdiend!', '👑', 'social', 100, 'epic')
ON CONFLICT DO NOTHING;