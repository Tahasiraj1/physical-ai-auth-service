import { Pool } from 'pg';

/**
 * Progress calculation utility to compute progress percentages from reading_progress table
 */
export class ProgressCalculator {
  constructor(private pool: Pool) {}

  /**
   * Calculate progress percentage for a module
   * @param userId User ID
   * @param moduleId Module ID
   * @param totalSections Total number of sections in the module
   * @returns Progress percentage (0-100)
   */
  async calculateModuleProgress(
    userId: string,
    moduleId: string,
    totalSections: number
  ): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(DISTINCT "sectionId") as viewed_count
       FROM reading_progress
       WHERE "userId" = $1 AND "moduleId" = $2`,
      [userId, moduleId]
    );

    const viewedCount = parseInt(result.rows[0]?.viewed_count || '0', 10);
    if (totalSections === 0) return 0;
    
    return Math.round((viewedCount / totalSections) * 100);
  }

  /**
   * Get progress summary for all modules
   * @param userId User ID
   * @param moduleSectionCounts Map of moduleId to total section count
   * @returns Progress summary by module
   */
  async getProgressSummary(
    userId: string,
    moduleSectionCounts: Record<string, number>
  ): Promise<Record<string, { totalSections: number; viewedSections: number; progressPercentage: number }>> {
    const summary: Record<string, { totalSections: number; viewedSections: number; progressPercentage: number }> = {};

    for (const [moduleId, totalSections] of Object.entries(moduleSectionCounts)) {
      const result = await this.pool.query(
        `SELECT COUNT(DISTINCT "sectionId") as viewed_count
         FROM reading_progress
         WHERE "userId" = $1 AND "moduleId" = $2`,
        [userId, moduleId]
      );

      const viewedCount = parseInt(result.rows[0]?.viewed_count || '0', 10);
      const progressPercentage = totalSections > 0 
        ? Math.round((viewedCount / totalSections) * 100)
        : 0;

      summary[moduleId] = {
        totalSections,
        viewedSections: viewedCount,
        progressPercentage,
      };
    }

    return summary;
  }
}

