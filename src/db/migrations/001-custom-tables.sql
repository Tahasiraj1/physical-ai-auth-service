-- Custom Personalization Tables Migration
-- Run this after Better Auth tables are created via `npx @better-auth/cli migrate`

-- User Profile (extends Better Auth user table)
CREATE TABLE IF NOT EXISTS user_profile (
    "userId" TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    "learningLevel" VARCHAR(50),
    preferences JSONB,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Reading Progress
CREATE TABLE IF NOT EXISTS reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "moduleId" VARCHAR(255) NOT NULL,
    "sectionId" VARCHAR(255) NOT NULL,
    "viewedAt" TIMESTAMP DEFAULT NOW(),
    "lastViewedAt" TIMESTAMP DEFAULT NOW(),
    "viewCount" INTEGER DEFAULT 1,
    completed BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("userId", "moduleId", "sectionId")
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_userId ON reading_progress("userId");
CREATE INDEX IF NOT EXISTS idx_reading_progress_moduleId ON reading_progress("moduleId");

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmark (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "moduleId" VARCHAR(255) NOT NULL,
    "sectionId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("userId", "moduleId", "sectionId")
);

CREATE INDEX IF NOT EXISTS idx_bookmark_userId ON bookmark("userId");
CREATE INDEX IF NOT EXISTS idx_bookmark_moduleId ON bookmark("moduleId");

-- User Notes
CREATE TABLE IF NOT EXISTS user_note (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "moduleId" VARCHAR(255) NOT NULL,
    "sectionId" VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("userId", "moduleId", "sectionId")
);

CREATE INDEX IF NOT EXISTS idx_user_note_userId ON user_note("userId");
CREATE INDEX IF NOT EXISTS idx_user_note_moduleId ON user_note("moduleId");
CREATE INDEX IF NOT EXISTS idx_user_note_sectionId ON user_note("sectionId");

-- User Comments
CREATE TABLE IF NOT EXISTS user_comment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "moduleId" VARCHAR(255) NOT NULL,
    "sectionId" VARCHAR(255) NOT NULL,
    "parentCommentId" UUID REFERENCES user_comment(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    "moderationStatus" VARCHAR(50) DEFAULT 'approved',
    "flaggedCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_comment_userId ON user_comment("userId");
CREATE INDEX IF NOT EXISTS idx_user_comment_moduleId ON user_comment("moduleId");
CREATE INDEX IF NOT EXISTS idx_user_comment_sectionId ON user_comment("sectionId");
CREATE INDEX IF NOT EXISTS idx_user_comment_parentCommentId ON user_comment("parentCommentId");
CREATE INDEX IF NOT EXISTS idx_user_comment_createdAt ON user_comment("createdAt");

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "sessionId" VARCHAR(255) NOT NULL,
    messages JSONB,
    "startedAt" TIMESTAMP DEFAULT NOW(),
    "lastActivityAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE("userId", "sessionId")
);

CREATE INDEX IF NOT EXISTS idx_chat_session_userId ON chat_session("userId");
CREATE INDEX IF NOT EXISTS idx_chat_session_sessionId ON chat_session("sessionId");

-- Downloadable Resources
CREATE TABLE IF NOT EXISTS downloadable_resource (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "fileName" VARCHAR(255) NOT NULL,
    "fileType" VARCHAR(100),
    "fileSize" BIGINT,
    "storageUrl" VARCHAR(500) NOT NULL,
    "moduleId" VARCHAR(255),
    description TEXT,
    "downloadCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_downloadable_resource_moduleId ON downloadable_resource("moduleId");

-- Download History
CREATE TABLE IF NOT EXISTS download_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "resourceId" UUID NOT NULL REFERENCES downloadable_resource(id) ON DELETE CASCADE,
    "downloadedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_history_userId ON download_history("userId");
CREATE INDEX IF NOT EXISTS idx_download_history_resourceId ON download_history("resourceId");
CREATE INDEX IF NOT EXISTS idx_download_history_downloadedAt ON download_history("downloadedAt");

-- Module Recommendations (optional, for caching)
CREATE TABLE IF NOT EXISTS module_recommendation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "recommendedModuleId" VARCHAR(255) NOT NULL,
    reason VARCHAR(255),
    "priorityScore" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "expiresAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_module_recommendation_userId ON module_recommendation("userId");
CREATE INDEX IF NOT EXISTS idx_module_recommendation_priorityScore ON module_recommendation("priorityScore" DESC);

