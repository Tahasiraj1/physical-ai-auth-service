import { Pool } from 'pg';

/**
 * Recommendation service to generate recommendations based on progress
 */
export class RecommendationService {
  constructor(private pool: Pool) {}

  /**
   * Generate personalized module recommendations
   * Algorithm: next module in sequence, continue incomplete modules, consider learning level
   */
  async generateRecommendations(
    userId: string,
    learningLevel: string = 'beginner'
  ): Promise<Array<{ moduleId: string; reason: string; priorityScore: number }>> {
    // Get user progress
    const progressResult = await this.pool.query(
      `SELECT "moduleId", COUNT(DISTINCT "sectionId") as viewed_count
       FROM reading_progress
       WHERE "userId" = $1
       GROUP BY "moduleId"`,
      [userId]
    );

    const moduleOrder = [
      'module-1-ros2-nervous-system',
      'module-2-digital-twins-simulation',
      'module-3-ai-robot-brain',
      'module-4-vision-language-action',
    ];

    const moduleSectionCounts: Record<string, number> = {
      'module-1-ros2-nervous-system': 7,
      'module-2-digital-twins-simulation': 12,
      'module-3-ai-robot-brain': 12,
      'module-4-vision-language-action': 13,
    };

    const progressMap: Record<string, number> = {};
    progressResult.rows.forEach((row: any) => {
      progressMap[row.moduleId] = parseInt(row.viewed_count, 10);
    });

    const recommendations: Array<{ moduleId: string; reason: string; priorityScore: number }> = [];

    // Find next module to recommend
    for (const moduleId of moduleOrder) {
      const viewed = progressMap[moduleId] || 0;
      const total = moduleSectionCounts[moduleId] || 0;

      if (viewed === 0) {
        recommendations.push({
          moduleId,
          reason: 'next_in_sequence',
          priorityScore: learningLevel === 'beginner' ? 100 : 90,
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

    return recommendations;
  }
}

