-- Create new enums for rewards catalog system
CREATE TYPE reward_category AS ENUM ('privileges', 'experience', 'financial');
CREATE TYPE redemption_status AS ENUM ('pending', 'approved', 'completed', 'cancelled');

-- Create reward templates table (system-wide catalog)
CREATE TABLE reward_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category reward_category NOT NULL,
  default_points INTEGER NOT NULL,
  min_age INTEGER NOT NULL DEFAULT 4,
  emoji VARCHAR(10),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family rewards table (customized rewards per family)
CREATE TABLE family_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  template_id UUID REFERENCES reward_templates(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category reward_category NOT NULL,
  points INTEGER NOT NULL,
  min_age INTEGER NOT NULL DEFAULT 4,
  emoji VARCHAR(10),
  estimated_cost INTEGER, -- in cents
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reward redemptions table (tracking point spending)
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES family_rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status redemption_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_family_rewards_family_id ON family_rewards(family_id);
CREATE INDEX idx_family_rewards_category ON family_rewards(category);
CREATE INDEX idx_family_rewards_active ON family_rewards(is_active);
CREATE INDEX idx_reward_redemptions_family_id ON reward_redemptions(family_id);
CREATE INDEX idx_reward_redemptions_child_id ON reward_redemptions(child_id);
CREATE INDEX idx_reward_redemptions_status ON reward_redemptions(status);
CREATE INDEX idx_reward_templates_category ON reward_templates(category);
CREATE INDEX idx_reward_templates_active ON reward_templates(is_active);