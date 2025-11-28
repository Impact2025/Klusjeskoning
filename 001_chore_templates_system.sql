-- ============================================================================
-- KlusjesKoning: Klusjes Templates & Onboarding System
-- Migratie: 001_chore_templates_system.sql
-- Datum: 2025-11-27
-- ============================================================================

-- ============================================================================
-- 1. CATEGORIEËN
-- ============================================================================
CREATE TABLE IF NOT EXISTS chore_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6366F1',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor sortering
CREATE INDEX idx_chore_categories_sort ON chore_categories(sort_order);

-- ============================================================================
-- 2. KLUSJES TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS chore_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id VARCHAR(50) NOT NULL REFERENCES chore_categories(id),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    
    -- Beloningen
    base_points INTEGER NOT NULL DEFAULT 10,
    base_xp INTEGER NOT NULL DEFAULT 4,
    
    -- Leeftijdsgrenzen
    min_age INTEGER NOT NULL DEFAULT 3,
    max_age INTEGER, -- NULL = geen maximum
    
    -- Vereisten
    requires_garden BOOLEAN NOT NULL DEFAULT FALSE,
    requires_pet BOOLEAN NOT NULL DEFAULT FALSE,
    requires_kitchen_access BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Metadata
    difficulty VARCHAR(20) NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    icon VARCHAR(10) NOT NULL DEFAULT '✨',
    estimated_minutes INTEGER NOT NULL DEFAULT 10,
    tips TEXT,
    sort_order INTEGER NOT NULL DEFAULT 100,
    
    -- Systeem
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chore_templates_category ON chore_templates(category_id);
CREATE INDEX idx_chore_templates_frequency ON chore_templates(frequency);
CREATE INDEX idx_chore_templates_age ON chore_templates(min_age, max_age);
CREATE INDEX idx_chore_templates_active ON chore_templates(is_active);
CREATE INDEX idx_chore_templates_sort ON chore_templates(sort_order);

-- ============================================================================
-- 3. STARTER PACKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS starter_packs (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Leeftijdsgrenzen
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    
    -- Metadata
    difficulty_level VARCHAR(20) NOT NULL DEFAULT 'easy' CHECK (difficulty_level IN ('minimal', 'easy', 'medium', 'hard')),
    chore_count INTEGER NOT NULL DEFAULT 5,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    recommended_for TEXT,
    
    -- Systeem
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor leeftijd lookup
CREATE INDEX idx_starter_packs_age ON starter_packs(min_age, max_age);
CREATE INDEX idx_starter_packs_default ON starter_packs(is_default);

-- ============================================================================
-- 4. STARTER PACK <-> CHORE TEMPLATE KOPPELING
-- ============================================================================
CREATE TABLE IF NOT EXISTS starter_pack_chores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    starter_pack_id VARCHAR(100) NOT NULL REFERENCES starter_packs(id) ON DELETE CASCADE,
    chore_template_id VARCHAR(100) NOT NULL REFERENCES chore_templates(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(starter_pack_id, chore_template_id)
);

CREATE INDEX idx_starter_pack_chores_pack ON starter_pack_chores(starter_pack_id);
CREATE INDEX idx_starter_pack_chores_template ON starter_pack_chores(chore_template_id);

-- ============================================================================
-- 5. ADD-ON PACKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS addon_packs (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Vereisten
    min_age INTEGER NOT NULL DEFAULT 5,
    requires_garden BOOLEAN NOT NULL DEFAULT FALSE,
    requires_pet BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Systeem
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. ADD-ON PACK <-> CHORE TEMPLATE KOPPELING
-- ============================================================================
CREATE TABLE IF NOT EXISTS addon_pack_chores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    addon_pack_id VARCHAR(100) NOT NULL REFERENCES addon_packs(id) ON DELETE CASCADE,
    chore_template_id VARCHAR(100) NOT NULL REFERENCES chore_templates(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(addon_pack_id, chore_template_id)
);

CREATE INDEX idx_addon_pack_chores_pack ON addon_pack_chores(addon_pack_id);

-- ============================================================================
-- 7. FAMILIES TABEL UITBREIDING
-- ============================================================================
ALTER TABLE families ADD COLUMN IF NOT EXISTS has_garden BOOLEAN DEFAULT FALSE;
ALTER TABLE families ADD COLUMN IF NOT EXISTS has_pets BOOLEAN DEFAULT FALSE;
ALTER TABLE families ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE families ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 8. CHILDREN TABEL UITBREIDING
-- ============================================================================
ALTER TABLE children ADD COLUMN IF NOT EXISTS kitchen_access BOOLEAN DEFAULT FALSE;
ALTER TABLE children ADD COLUMN IF NOT EXISTS starter_pack_id VARCHAR(100) REFERENCES starter_packs(id);
ALTER TABLE children ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE children ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 9. CHORE SUGGESTIONS (Adaptive Growth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS chore_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    chore_template_id VARCHAR(100) NOT NULL REFERENCES chore_templates(id) ON DELETE CASCADE,
    
    -- Reden voor suggestie
    trigger_reason VARCHAR(50) NOT NULL CHECK (trigger_reason IN (
        'streak',           -- Kind heeft streak behaald
        'completion_rate',  -- Hoge voltooiingsratio
        'age_milestone',    -- Leeftijdsgrens bereikt
        'time_based',       -- X weken geen nieuwe klusjes
        'manual',           -- Handmatig door systeem/admin
        'ai_recommended'    -- AI aanbeveling
    )),
    trigger_data JSONB, -- Extra context (bijv. welke streak, hoeveel %)
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'accepted',
        'dismissed',
        'snoozed',
        'expired'
    )),
    
    -- Timing
    suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    snoozed_until TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    
    -- Metadata
    priority INTEGER NOT NULL DEFAULT 5, -- 1-10, hoger = belangrijker
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chore_suggestions_child ON chore_suggestions(child_id);
CREATE INDEX idx_chore_suggestions_status ON chore_suggestions(status);
CREATE INDEX idx_chore_suggestions_pending ON chore_suggestions(child_id, status) WHERE status = 'pending';

-- ============================================================================
-- 10. ONBOARDING EVENTS (Analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS onboarding_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_onboarding_events_family ON onboarding_events(family_id);
CREATE INDEX idx_onboarding_events_type ON onboarding_events(event_type);

-- ============================================================================
-- 11. HELPER VIEWS
-- ============================================================================

-- View: Beschikbare templates per leeftijd
CREATE OR REPLACE VIEW v_templates_by_age AS
SELECT 
    ct.*,
    cc.name as category_name,
    cc.icon as category_icon,
    cc.color as category_color
FROM chore_templates ct
JOIN chore_categories cc ON ct.category_id = cc.id
WHERE ct.is_active = TRUE
ORDER BY cc.sort_order, ct.sort_order;

-- View: Starter packs met chore count
CREATE OR REPLACE VIEW v_starter_packs_summary AS
SELECT 
    sp.*,
    COUNT(spc.id) as actual_chore_count,
    ARRAY_AGG(ct.name ORDER BY spc.sort_order) as chore_names
FROM starter_packs sp
LEFT JOIN starter_pack_chores spc ON sp.id = spc.starter_pack_id
LEFT JOIN chore_templates ct ON spc.chore_template_id = ct.id
WHERE sp.is_active = TRUE
GROUP BY sp.id;

-- View: Beschikbare add-ons per gezinssituatie
CREATE OR REPLACE VIEW v_available_addons AS
SELECT 
    ap.*,
    COUNT(apc.id) as chore_count,
    ARRAY_AGG(ct.name ORDER BY apc.sort_order) as chore_names
FROM addon_packs ap
LEFT JOIN addon_pack_chores apc ON ap.id = apc.addon_pack_id
LEFT JOIN chore_templates ct ON apc.chore_template_id = ct.id
WHERE ap.is_active = TRUE
GROUP BY ap.id;

-- ============================================================================
-- 12. HELPER FUNCTIONS
-- ============================================================================

-- Functie: Haal starter packs op voor een leeftijd
CREATE OR REPLACE FUNCTION get_starter_packs_for_age(child_age INTEGER)
RETURNS TABLE (
    id VARCHAR(100),
    name VARCHAR(100),
    description TEXT,
    difficulty_level VARCHAR(20),
    chore_count INTEGER,
    is_default BOOLEAN,
    recommended_for TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.name,
        sp.description,
        sp.difficulty_level,
        sp.chore_count,
        sp.is_default,
        sp.recommended_for
    FROM starter_packs sp
    WHERE sp.is_active = TRUE
      AND sp.min_age <= child_age
      AND sp.max_age >= child_age
    ORDER BY 
        CASE sp.difficulty_level 
            WHEN 'minimal' THEN 1 
            WHEN 'easy' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'hard' THEN 4 
        END;
END;
$$ LANGUAGE plpgsql;

-- Functie: Haal beschikbare templates op voor een kind
CREATE OR REPLACE FUNCTION get_available_templates_for_child(
    child_age INTEGER,
    has_garden BOOLEAN DEFAULT FALSE,
    has_pet BOOLEAN DEFAULT FALSE,
    has_kitchen BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id VARCHAR(100),
    name VARCHAR(100),
    description TEXT,
    category_id VARCHAR(50),
    frequency VARCHAR(20),
    base_points INTEGER,
    base_xp INTEGER,
    difficulty VARCHAR(20),
    icon VARCHAR(10),
    estimated_minutes INTEGER,
    tips TEXT,
    is_recommended BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ct.id,
        ct.name,
        ct.description,
        ct.category_id,
        ct.frequency,
        ct.base_points,
        ct.base_xp,
        ct.difficulty,
        ct.icon,
        ct.estimated_minutes,
        ct.tips,
        -- Aanbevolen als alle vereisten matchen EN leeftijd is ideaal
        (
            ct.min_age <= child_age 
            AND (ct.max_age IS NULL OR ct.max_age >= child_age)
            AND (NOT ct.requires_garden OR has_garden)
            AND (NOT ct.requires_pet OR has_pet)
            AND (NOT ct.requires_kitchen_access OR has_kitchen)
        ) as is_recommended
    FROM chore_templates ct
    WHERE ct.is_active = TRUE
      AND ct.min_age <= child_age
      AND (ct.max_age IS NULL OR ct.max_age >= child_age)
    ORDER BY ct.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Functie: Maak klusjes aan vanuit starter pack
CREATE OR REPLACE FUNCTION apply_starter_pack_to_child(
    p_child_id UUID,
    p_starter_pack_id VARCHAR(100),
    p_family_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_template RECORD;
BEGIN
    -- Loop door alle templates in het starter pack
    FOR v_template IN 
        SELECT ct.* 
        FROM starter_pack_chores spc
        JOIN chore_templates ct ON spc.chore_template_id = ct.id
        WHERE spc.starter_pack_id = p_starter_pack_id
        ORDER BY spc.sort_order
    LOOP
        -- Insert chore (aanpassen aan je bestaande chores tabel structuur)
        INSERT INTO chores (
            family_id,
            title,
            description,
            points,
            xp,
            frequency,
            assigned_child_id,
            template_id,
            created_at
        ) VALUES (
            p_family_id,
            v_template.name,
            v_template.description,
            v_template.base_points,
            v_template.base_xp,
            v_template.frequency,
            p_child_id,
            v_template.id,
            NOW()
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    -- Update child record
    UPDATE children 
    SET starter_pack_id = p_starter_pack_id,
        onboarding_completed = TRUE,
        onboarding_completed_at = NOW()
    WHERE id = p_child_id;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. TRIGGERS
-- ============================================================================

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY[
            'chore_categories',
            'chore_templates',
            'starter_packs',
            'addon_packs',
            'chore_suggestions'
        ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- ============================================================================
-- DONE
-- ============================================================================
