/**
 * TypeScript types for custom personalization tables
 * These types correspond to the database schema defined in migrations/001-custom-tables.sql and 002-avatar-personalization.sql
 */

export interface Avatar {
  id: string;
  imageUrl: string;
  displayName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  learningLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  preferences: Record<string, any> | null;
  selectedAvatarId: string | null;
  softwarePreferences: string[] | null;
  hardwarePreferences: string[] | null;
  programmingLanguagePreferences: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadingProgress {
  id: string;
  userId: string;
  moduleId: string;
  sectionId: string;
  viewedAt: Date;
  lastViewedAt: Date;
  viewCount: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bookmark {
  id: string;
  userId: string;
  moduleId: string;
  sectionId: string;
  createdAt: Date;
}

export interface UserNote {
  id: string;
  userId: string;
  moduleId: string;
  sectionId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserComment {
  id: string;
  userId: string;
  moduleId: string;
  sectionId: string;
  parentCommentId: string | null;
  content: string;
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  flaggedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  sessionId: string;
  messages: any[] | null;
  startedAt: Date;
  lastActivityAt: Date;
}

export interface DownloadableResource {
  id: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  storageUrl: string;
  moduleId: string | null;
  description: string | null;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DownloadHistory {
  id: string;
  userId: string;
  resourceId: string;
  downloadedAt: Date;
}

export interface ModuleRecommendation {
  id: string;
  userId: string;
  recommendedModuleId: string;
  reason: string | null;
  priorityScore: number;
  createdAt: Date;
  expiresAt: Date | null;
}

