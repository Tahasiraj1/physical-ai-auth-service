import { Pool } from 'pg';
import { Avatar, UserProfile } from '../db/schema.js';

export class AvatarService {
  constructor(private pool: Pool) {}

  /**
   * Get all active avatars available for user selection
   */
  async getActiveAvatars(): Promise<Avatar[]> {
    try {
      const result = await this.pool.query<Avatar>(
        `SELECT id, "imageUrl", "displayName", "isActive", "createdAt", "updatedAt"
         FROM avatar
         WHERE "isActive" = true
         ORDER BY "displayName" ASC`
      );
      return result.rows;
    } catch (error: any) {
      console.error('[AvatarService] Error fetching active avatars:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Get user's avatar data including selected avatar or first letter info
   */
  async getUserAvatarData(userId: string): Promise<{
    hasSelectedAvatar: boolean;
    selectedAvatarId: string | null;
    selectedAvatarImageUrl: string | null;
    userName: string;
    avatarDisplayType: 'predefined' | 'letter' | 'default';
    firstLetter: string | null;
  }> {
    const result = await this.pool.query<{
      userId: string;
      name: string;
      selectedAvatarId: string | null;
      avatarImageUrl: string | null;
    }>(
      `SELECT 
        u.id as "userId",
        u.name,
        up."selectedAvatarId",
        a."imageUrl" as "avatarImageUrl"
      FROM "user" u
      LEFT JOIN user_profile up ON u.id = up."userId"
      LEFT JOIN avatar a ON up."selectedAvatarId" = a.id AND a."isActive" = true
      WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      console.error('[AvatarService] User not found:', { userId, timestamp: new Date().toISOString() });
      throw new Error('User not found');
    }

    const row = result.rows[0];
    const hasSelectedAvatar = !!row.selectedAvatarId && !!row.avatarImageUrl;

    let avatarDisplayType: 'predefined' | 'letter' | 'default' = 'default';
    let firstLetter: string | null = null;

    if (hasSelectedAvatar) {
      avatarDisplayType = 'predefined';
    } else if (row.name && row.name.trim().length > 0) {
      avatarDisplayType = 'letter';
      // Extract first alphanumeric character
      const match = row.name.match(/[a-zA-Z0-9]/);
      firstLetter = match ? match[0].toUpperCase() : '?';
    } else {
      avatarDisplayType = 'default';
      firstLetter = '?';
    }

    return {
      hasSelectedAvatar,
      selectedAvatarId: row.selectedAvatarId,
      selectedAvatarImageUrl: row.avatarImageUrl,
      userName: row.name || '',
      avatarDisplayType,
      firstLetter,
    };
  }

  /**
   * Update user's selected avatar
   */
  async updateUserAvatar(userId: string, avatarId: string | null): Promise<void> {
    try {
      // If avatarId is provided, verify it exists and is active
      if (avatarId) {
        const avatarCheck = await this.pool.query(
          'SELECT id FROM avatar WHERE id = $1 AND "isActive" = true',
          [avatarId]
        );

        if (avatarCheck.rows.length === 0) {
          console.error('[AvatarService] Invalid avatar selection:', {
            userId,
            avatarId,
            timestamp: new Date().toISOString(),
          });
          throw new Error(`Avatar with ID '${avatarId}' not found or inactive`);
        }
      }

      // Update user profile
      const updateResult = await this.pool.query(
        `UPDATE user_profile
         SET "selectedAvatarId" = $1, "updatedAt" = NOW()
         WHERE "userId" = $2`,
        [avatarId, userId]
      );

      if (updateResult.rowCount === 0) {
        console.error('[AvatarService] User profile not found for update:', {
          userId,
          timestamp: new Date().toISOString(),
        });
        throw new Error('User profile not found');
      }

      console.log('[AvatarService] Avatar updated successfully:', {
        userId,
        avatarId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[AvatarService] Error updating user avatar:', {
        userId,
        avatarId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
}

