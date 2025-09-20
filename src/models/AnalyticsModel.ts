import { pool } from '../config/database';
import { AnalyticsRecord } from '../types';

export class AnalyticsModel {
  /**
   * Create analytics record for a URL
   */
  static async createAnalytics(urlId: number): Promise<AnalyticsRecord> {
    const query = `
      INSERT INTO analytics (url_id, first_click_at, last_click_at, total_clicks)
      VALUES ($1, NOW(), NOW(), 1)
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [urlId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating analytics:', error);
      throw new Error('Failed to create analytics');
    }
  }

  /**
   * Update analytics for a click
   */
  static async updateAnalytics(urlId: number): Promise<void> {
    const query = `
      UPDATE analytics 
      SET 
        last_click_at = NOW(),
        total_clicks = total_clicks + 1,
        first_click_at = COALESCE(first_click_at, NOW())
      WHERE url_id = $1
    `;
    
    try {
      await pool.query(query, [urlId]);
    } catch (error) {
      console.error('Error updating analytics:', error);
      throw new Error('Failed to update analytics');
    }
  }

  /**
   * Get analytics for a URL
   */
  static async getAnalyticsByUrlId(urlId: number): Promise<AnalyticsRecord | null> {
    const query = 'SELECT * FROM analytics WHERE url_id = $1';
    
    try {
      const result = await pool.query(query, [urlId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw new Error('Failed to retrieve analytics');
    }
  }

  /**
   * Get analytics by short code
   */
  static async getAnalyticsByShortCode(shortCode: string): Promise<AnalyticsRecord | null> {
    const query = `
      SELECT a.* FROM analytics a
      JOIN urls u ON a.url_id = u.id
      WHERE u.short_code = $1
    `;
    
    try {
      const result = await pool.query(query, [shortCode]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting analytics by short code:', error);
      throw new Error('Failed to retrieve analytics');
    }
  }

  /**
   * Get or create analytics for a URL
   */
  static async getOrCreateAnalytics(urlId: number): Promise<AnalyticsRecord> {
    let analytics = await this.getAnalyticsByUrlId(urlId);
    
    if (!analytics) {
      analytics = await this.createAnalytics(urlId);
    } else {
      await this.updateAnalytics(urlId);
      analytics = await this.getAnalyticsByUrlId(urlId);
    }
    
    return analytics!;
  }
}
