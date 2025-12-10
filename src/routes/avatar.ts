import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { requireAuth } from '../utils/auth-middleware.js';
import { AvatarService } from '../services/avatar-service.js';

const router = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const avatarService = new AvatarService(pool);

/**
 * GET /avatar/list
 * Public endpoint to get all active avatars
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const avatars = await avatarService.getActiveAvatars();
    res.json({ avatars });
  } catch (error: any) {
    console.error('Error fetching avatars:', error);
    res.status(500).json({
      error: 'Failed to fetch avatars',
      message: error.message,
    });
  }
});

/**
 * GET /personalization/avatar
 * Protected endpoint to get current user's avatar data
 */
router.get('/personalization/avatar', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const avatarData = await avatarService.getUserAvatarData(userId);
    res.json({ avatar: avatarData });
  } catch (error: any) {
    console.error('Error fetching user avatar data:', error);
    res.status(500).json({
      error: 'Failed to fetch avatar data',
      message: error.message,
    });
  }
});

/**
 * PUT /personalization/avatar
 * Protected endpoint to update user's selected avatar
 */
router.put('/personalization/avatar', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { avatarId } = req.body;

    // Validate avatarId if provided
    if (avatarId !== null && avatarId !== undefined) {
      if (typeof avatarId !== 'string') {
        return res.status(400).json({
          error: 'Invalid avatar selection',
          message: 'avatarId must be a string or null',
        });
      }
    }

    await avatarService.updateUserAvatar(userId, avatarId || null);

    // Return updated avatar data
    const avatarData = await avatarService.getUserAvatarData(userId);
    res.json({
      success: true,
      avatar: {
        selectedAvatarId: avatarData.selectedAvatarId,
        selectedAvatarImageUrl: avatarData.selectedAvatarImageUrl,
      },
    });
  } catch (error: any) {
    console.error('Error updating user avatar:', error);
    
    if (error.message.includes('not found') || error.message.includes('inactive')) {
      return res.status(404).json({
        error: 'Invalid avatar selection',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to update avatar',
      message: error.message,
    });
  }
});

export default router;

