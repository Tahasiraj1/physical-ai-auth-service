-- Avatar and Personalization Migration
-- Run this after 001-custom-tables.sql migration
-- Adds Avatar table and extends user_profile with avatar selection and personalization preferences

-- Avatar Table
CREATE TABLE IF NOT EXISTS avatar (
    id TEXT PRIMARY KEY,
    "imageUrl" TEXT NOT NULL,
    "displayName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Index for filtering active avatars
CREATE INDEX IF NOT EXISTS idx_avatar_isActive ON avatar("isActive");

-- Insert 10 predefined avatars
INSERT INTO avatar (id, "imageUrl", "displayName", "isActive") VALUES
('avatar-1', '/static/avatars/avatar-1.png', 'Robot Avatar 1', true),
('avatar-2', '/static/avatars/avatar-2.png', 'Robot Avatar 2', true),
('avatar-3', '/static/avatars/avatar-3.png', 'Robot Avatar 3', true),
('avatar-4', '/static/avatars/avatar-4.png', 'Robot Avatar 4', true),
('avatar-5', '/static/avatars/avatar-5.png', 'Robot Avatar 5', true),
('avatar-6', '/static/avatars/avatar-6.png', 'Robot Avatar 6', true),
('avatar-7', '/static/avatars/avatar-7.png', 'Robot Avatar 7', true),
('avatar-8', '/static/avatars/avatar-8.png', 'Robot Avatar 8', true),
('avatar-9', '/static/avatars/avatar-9.png', 'Robot Avatar 9', true),
('avatar-10', '/static/avatars/avatar-10.png', 'Robot Avatar 10', true)
ON CONFLICT (id) DO NOTHING;

-- Extend user_profile table with new columns
ALTER TABLE user_profile 
ADD COLUMN IF NOT EXISTS "selectedAvatarId" TEXT,
ADD COLUMN IF NOT EXISTS "softwarePreferences" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "hardwarePreferences" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "programmingLanguagePreferences" JSONB DEFAULT '[]'::jsonb;

-- Foreign key constraint for selectedAvatarId
-- Check if constraint exists before adding (PostgreSQL doesn't support IF NOT EXISTS for constraints)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_user_profile_avatar'
    ) THEN
        ALTER TABLE user_profile
        ADD CONSTRAINT fk_user_profile_avatar 
        FOREIGN KEY ("selectedAvatarId") REFERENCES avatar(id) ON DELETE SET NULL;
    END IF;
END $$;

-- GIN indexes for JSONB columns (efficient querying of array contents)
CREATE INDEX IF NOT EXISTS idx_user_profile_software_prefs 
ON user_profile USING GIN ("softwarePreferences");

CREATE INDEX IF NOT EXISTS idx_user_profile_hardware_prefs 
ON user_profile USING GIN ("hardwarePreferences");

CREATE INDEX IF NOT EXISTS idx_user_profile_lang_prefs 
ON user_profile USING GIN ("programmingLanguagePreferences");

-- Index for avatar selection lookups
CREATE INDEX IF NOT EXISTS idx_user_profile_selectedAvatarId 
ON user_profile("selectedAvatarId");

