import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { requireAuth } from '../utils/auth-middleware.js';
import { ProgressCalculator } from '../utils/progress-calculator.js';

const router = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const progressCalculator = new ProgressCalculator(pool);

// All personalization routes require authentication
router.use(requireAuth);

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'personalization' });
});

// Progress tracking routes
router.post('/progress', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { moduleId, sectionId } = req.body;

    if (!moduleId || !sectionId) {
      return res.status(400).json({ error: 'moduleId and sectionId are required' });
    }

    // Insert or update progress (upsert)
    const result = await pool.query(
      `INSERT INTO reading_progress ("userId", "moduleId", "sectionId", "viewedAt", "lastViewedAt", "viewCount")
       VALUES ($1, $2, $3, NOW(), NOW(), 1)
       ON CONFLICT ("userId", "moduleId", "sectionId")
       DO UPDATE SET
         "lastViewedAt" = NOW(),
         "viewCount" = reading_progress."viewCount" + 1,
         "updatedAt" = NOW()
       RETURNING *`,
      [userId, moduleId, sectionId]
    );

    res.json({ progress: result.rows[0] });
  } catch (error: any) {
    console.error('Error recording progress:', error);
    res.status(500).json({ error: 'Failed to record progress', message: error.message });
  }
});

router.get('/progress', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { moduleId } = req.query;

    let query = `
      SELECT * FROM reading_progress
      WHERE "userId" = $1
    `;
    const params: any[] = [userId];

    if (moduleId) {
      query += ` AND "moduleId" = $2`;
      params.push(moduleId);
    }

    query += ` ORDER BY "lastViewedAt" DESC`;

    const result = await pool.query(query, params);

    // Calculate summary if no moduleId filter
    let summary = {};
    if (!moduleId) {
      // Get all unique modules
      const modulesResult = await pool.query(
        `SELECT DISTINCT "moduleId" FROM reading_progress WHERE "userId" = $1`,
        [userId]
      );

      // TODO: Get actual section counts from Docusaurus content structure
      // For now, use placeholder counts
      const moduleSectionCounts: Record<string, number> = {
        'module-1-ros2-nervous-system': 7,
        'module-2-digital-twins-simulation': 12,
        'module-3-ai-robot-brain': 12,
        'module-4-vision-language-action': 13,
      };

      const userModules = modulesResult.rows.map((r: any) => r.moduleId);
      const filteredCounts: Record<string, number> = {};
      userModules.forEach((moduleId: string) => {
        if (moduleSectionCounts[moduleId]) {
          filteredCounts[moduleId] = moduleSectionCounts[moduleId];
        }
      });

      summary = await progressCalculator.getProgressSummary(userId, filteredCounts);
    }

    res.json({
      progress: result.rows,
      summary,
    });
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress', message: error.message });
  }
});

// Bookmark routes (Phase 5)
router.post('/bookmarks', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { moduleId, sectionId } = req.body;

    if (!moduleId || !sectionId) {
      return res.status(400).json({ error: 'moduleId and sectionId are required' });
    }

    const result = await pool.query(
      `INSERT INTO bookmark ("userId", "moduleId", "sectionId")
       VALUES ($1, $2, $3)
       ON CONFLICT ("userId", "moduleId", "sectionId") DO NOTHING
       RETURNING *`,
      [userId, moduleId, sectionId]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Bookmark already exists' });
    }

    res.json({ bookmark: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating bookmark:', error);
    res.status(500).json({ error: 'Failed to create bookmark', message: error.message });
  }
});

router.get('/bookmarks', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { moduleId } = req.query;

    let query = `SELECT * FROM bookmark WHERE "userId" = $1`;
    const params: any[] = [userId];

    if (moduleId) {
      query += ` AND "moduleId" = $2`;
      params.push(moduleId);
    }

    query += ` ORDER BY "createdAt" DESC`;

    const result = await pool.query(query, params);
    res.json({ bookmarks: result.rows });
  } catch (error: any) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks', message: error.message });
  }
});

router.get('/bookmarks/check', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { moduleId, sectionId } = req.query;

    if (!moduleId || !sectionId) {
      return res.status(400).json({ error: 'moduleId and sectionId are required' });
    }

    const result = await pool.query(
      `SELECT * FROM bookmark
       WHERE "userId" = $1 AND "moduleId" = $2 AND "sectionId" = $3`,
      [userId, moduleId, sectionId]
    );

    res.json({ isBookmarked: result.rows.length > 0, bookmark: result.rows[0] || null });
  } catch (error: any) {
    console.error('Error checking bookmark:', error);
    res.status(500).json({ error: 'Failed to check bookmark', message: error.message });
  }
});

router.delete('/bookmarks/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM bookmark WHERE id = $1 AND "userId" = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json({ message: 'Bookmark deleted', bookmark: result.rows[0] });
  } catch (error: any) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({ error: 'Failed to delete bookmark', message: error.message });
  }
});

// Note routes (Phase 8)
router.post('/notes', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { moduleId, sectionId, content } = req.body;

    if (!moduleId || !sectionId || !content) {
      return res.status(400).json({ error: 'moduleId, sectionId, and content are required' });
    }

    const result = await pool.query(
      `INSERT INTO user_note ("userId", "moduleId", "sectionId", content)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("userId", "moduleId", "sectionId")
       DO UPDATE SET content = $4, "updatedAt" = NOW()
       RETURNING *`,
      [userId, moduleId, sectionId, content]
    );

    res.json({ note: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating/updating note:', error);
    res.status(500).json({ error: 'Failed to save note', message: error.message });
  }
});

router.get('/notes', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { moduleId, sectionId } = req.query;

    let query = `SELECT * FROM user_note WHERE "userId" = $1`;
    const params: any[] = [userId];

    if (moduleId) {
      query += ` AND "moduleId" = $2`;
      params.push(moduleId);
      if (sectionId) {
        query += ` AND "sectionId" = $3`;
        params.push(sectionId);
      }
    }

    query += ` ORDER BY "updatedAt" DESC`;

    const result = await pool.query(query, params);
    res.json({ notes: result.rows });
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes', message: error.message });
  }
});

router.delete('/notes/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM user_note WHERE id = $1 AND "userId" = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted', note: result.rows[0] });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note', message: error.message });
  }
});

// Comment routes (Phase 10)
router.post('/comments', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { moduleId, sectionId, content, parentCommentId } = req.body;

    if (!moduleId || !sectionId || !content) {
      return res.status(400).json({ error: 'moduleId, sectionId, and content are required' });
    }

    const result = await pool.query(
      `INSERT INTO user_comment ("userId", "moduleId", "sectionId", content, "parentCommentId", "moderationStatus")
       VALUES ($1, $2, $3, $4, $5, 'approved')
       RETURNING *`,
      [userId, moduleId, sectionId, content, parentCommentId || null]
    );

    res.json({ comment: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment', message: error.message });
  }
});

router.get('/comments', async (req: Request, res: Response) => {
  try {
    const { moduleId, sectionId } = req.query;

    if (!moduleId || !sectionId) {
      return res.status(400).json({ error: 'moduleId and sectionId are required' });
    }

    // Get approved comments only
    const result = await pool.query(
      `SELECT c.*, u.name, u.email
       FROM user_comment c
       JOIN "user" u ON c."userId" = u.id
       WHERE c."moduleId" = $1 AND c."sectionId" = $2 AND c."moderationStatus" = 'approved'
       ORDER BY c."createdAt" ASC`,
      [moduleId, sectionId]
    );

    res.json({ comments: result.rows });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments', message: error.message });
  }
});

// Recommendation routes (Phase 6)
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get user profile for learning level
    const profileResult = await pool.query(
      `SELECT "learningLevel" FROM user_profile WHERE "userId" = $1`,
      [userId]
    );
    const learningLevel = profileResult.rows[0]?.learningLevel || 'beginner';

    // Use recommendation service
    const { RecommendationService } = await import('../services/recommendation-service.js');
    const recommendationService = new RecommendationService(pool);
    const recommendations = await recommendationService.generateRecommendations(userId, learningLevel);

    res.json({ recommendations });
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations', message: error.message });
  }
});

// Chat session routes (Phase 7)
router.post('/chat-sessions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId, messages } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const result = await pool.query(
      `INSERT INTO chat_session ("userId", "sessionId", messages, "lastActivityAt")
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT ("userId", "sessionId")
       DO UPDATE SET messages = $3::jsonb, "lastActivityAt" = NOW()
       RETURNING *`,
      [userId, sessionId, JSON.stringify(messages || [])]
    );

    res.json({ session: result.rows[0] });
  } catch (error: any) {
    console.error('Error saving chat session:', error);
    res.status(500).json({ error: 'Failed to save chat session', message: error.message });
  }
});

router.get('/chat-sessions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await pool.query(
      `SELECT * FROM chat_session
       WHERE "userId" = $1
       ORDER BY "lastActivityAt" DESC`,
      [userId]
    );

    res.json({ sessions: result.rows });
  } catch (error: any) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions', message: error.message });
  }
});

// Dashboard route (Phase 11)
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Fetch all dashboard data in parallel
    const [progressResult, bookmarksResult, notesResult, commentsResult, downloadHistoryResult] = await Promise.all([
      pool.query(`SELECT * FROM reading_progress WHERE "userId" = $1 ORDER BY "lastViewedAt" DESC LIMIT 50`, [userId]),
      pool.query(`SELECT * FROM bookmark WHERE "userId" = $1 ORDER BY "createdAt" DESC`, [userId]),
      pool.query(`SELECT * FROM user_note WHERE "userId" = $1 ORDER BY "updatedAt" DESC`, [userId]),
      pool.query(`SELECT * FROM user_comment WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 20`, [userId]),
      pool.query(
        `SELECT dh.*, dr."fileName", dr."moduleId"
         FROM download_history dh
         JOIN downloadable_resource dr ON dh."resourceId" = dr.id
         WHERE dh."userId" = $1
         ORDER BY dh."downloadedAt" DESC LIMIT 20`,
        [userId]
      ),
    ]);

    // Calculate progress summary
    const moduleSectionCounts: Record<string, number> = {
      'module-1-ros2-nervous-system': 7,
      'module-2-digital-twins-simulation': 12,
      'module-3-ai-robot-brain': 12,
      'module-4-vision-language-action': 13,
    };

    const summary = await progressCalculator.getProgressSummary(userId, moduleSectionCounts);

    // Get recommendations
    const profileResult = await pool.query(
      `SELECT "learningLevel" FROM user_profile WHERE "userId" = $1`,
      [userId]
    );
    const learningLevel = profileResult.rows[0]?.learningLevel || 'beginner';

    const progressMap: Record<string, number> = {};
    progressResult.rows.forEach((row: any) => {
      if (!progressMap[row.moduleId]) progressMap[row.moduleId] = 0;
      progressMap[row.moduleId]++;
    });

    const moduleOrder = [
      'module-1-ros2-nervous-system',
      'module-2-digital-twins-simulation',
      'module-3-ai-robot-brain',
      'module-4-vision-language-action',
    ];

    // Reuse moduleSectionCounts already declared above
    const recommendations: any[] = [];
    for (const moduleId of moduleOrder) {
      const viewed = progressMap[moduleId] || 0;
      const total = moduleSectionCounts[moduleId] || 0;

      if (viewed === 0) {
        recommendations.push({
          moduleId,
          reason: 'next_in_sequence',
          priorityScore: 100,
        });
        break;
      } else if (viewed < total) {
        recommendations.push({
          moduleId,
          reason: 'continue_module',
          priorityScore: 90,
        });
        break;
      }
    }

    res.json({
      progress: {
        recent: progressResult.rows,
        summary,
      },
      bookmarks: bookmarksResult.rows,
      notes: notesResult.rows,
      comments: commentsResult.rows,
      downloadHistory: downloadHistoryResult.rows,
      recommendations,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data', message: error.message });
  }
});

/**
 * PUT /personalization/preferences
 * Update user's personalization preferences (software, hardware, programming languages)
 */
router.put('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { softwarePreferences, hardwarePreferences, programmingLanguagePreferences } = req.body;

    // Validate that preferences are arrays of strings or null
    const validatePreferenceArray = (pref: any, name: string): string[] | null => {
      if (pref === null || pref === undefined) {
        return null;
      }
      if (!Array.isArray(pref)) {
        throw new Error(`${name} must be an array or null`);
      }
      if (!pref.every((item: any) => typeof item === 'string')) {
        throw new Error(`${name} must contain only strings`);
      }
      return pref;
    };

    const softwarePrefs = validatePreferenceArray(softwarePreferences, 'softwarePreferences');
    const hardwarePrefs = validatePreferenceArray(hardwarePreferences, 'hardwarePreferences');
    const langPrefs = validatePreferenceArray(programmingLanguagePreferences, 'programmingLanguagePreferences');

    // Update user profile
    await pool.query(
      `UPDATE user_profile
       SET 
         "softwarePreferences" = COALESCE($1::jsonb, "softwarePreferences"),
         "hardwarePreferences" = COALESCE($2::jsonb, "hardwarePreferences"),
         "programmingLanguagePreferences" = COALESCE($3::jsonb, "programmingLanguagePreferences"),
         "updatedAt" = NOW()
       WHERE "userId" = $4`,
      [
        softwarePrefs ? JSON.stringify(softwarePrefs) : null,
        hardwarePrefs ? JSON.stringify(hardwarePrefs) : null,
        langPrefs ? JSON.stringify(langPrefs) : null,
        userId,
      ]
    );

    res.json({
      success: true,
      preferences: {
        softwarePreferences: softwarePrefs || [],
        hardwarePreferences: hardwarePrefs || [],
        programmingLanguagePreferences: langPrefs || [],
      },
    });
  } catch (error: any) {
    const userId = (req as any).user?.id;
    console.error('[Personalization] Error updating preferences:', {
      userId,
      error: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString(),
    });
    res.status(400).json({
      error: 'Failed to update preferences',
      message: error.message,
    });
  }
});

/**
 * GET /personalization/profile
 * Get complete user profile including avatar and personalization preferences
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await pool.query<{
      userId: string;
      name: string;
      email: string;
      learningLevel: string | null;
      selectedAvatarId: string | null;
      avatarImageUrl: string | null;
      softwarePreferences: string[] | null;
      hardwarePreferences: string[] | null;
      programmingLanguagePreferences: string[] | null;
      createdAt: Date;
      updatedAt: Date;
    }>(
      `SELECT 
        u.id as "userId",
        u.name,
        u.email,
        up."learningLevel",
        up."selectedAvatarId",
        a."imageUrl" as "avatarImageUrl",
        up."softwarePreferences",
        up."hardwarePreferences",
        up."programmingLanguagePreferences",
        up."createdAt",
        up."updatedAt"
      FROM "user" u
      LEFT JOIN user_profile up ON u.id = up."userId"
      LEFT JOIN avatar a ON up."selectedAvatarId" = a.id AND a."isActive" = true
      WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = result.rows[0];

    res.json({
      profile: {
        userId: row.userId,
        name: row.name,
        email: row.email,
        learningLevel: row.learningLevel,
        selectedAvatarId: row.selectedAvatarId,
        selectedAvatarImageUrl: row.avatarImageUrl,
        softwarePreferences: row.softwarePreferences || [],
        hardwarePreferences: row.hardwarePreferences || [],
        programmingLanguagePreferences: row.programmingLanguagePreferences || [],
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    });
  } catch (error: any) {
    const userId = (req as any).user?.id;
    console.error('[Personalization] Error fetching profile:', {
      userId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message,
    });
  }
});

export default router;
