import { AnalyticsModel } from '../models/AnalyticsModel';
import { UrlModel } from '../models/UrlModel';
import { AnalyticsResponse } from '../types';
import { pool } from '../config/database';

export class AnalyticsService {
  /**
   * Track a click on a short URL
   */
  static async trackClick(shortCode: string, userAgent?: string, ipAddress?: string): Promise<void> {
    try {
      // Get URL record
      const urlRecord = await UrlModel.getUrlByShortCode(shortCode);
      
      if (!urlRecord) {
        throw new Error('URL not found');
      }

      // Update analytics
      await AnalyticsModel.getOrCreateAnalytics(urlRecord.id);

      // Log click details (for future enhancements)
      console.log(`Click tracked for ${shortCode}:`, {
        urlId: urlRecord.id,
        userAgent: userAgent?.substring(0, 100), // Truncate for logging
        ipAddress,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error tracking click:', error);
      throw new Error('Failed to track click');
    }
  }

  /**
   * Get analytics for a short code
   */
  static async getAnalytics(shortCode: string): Promise<AnalyticsResponse | null> {
    try {
      // Get URL record
      const urlRecord = await UrlModel.getUrlByShortCode(shortCode);
      
      if (!urlRecord) {
        return null;
      }

      // Get analytics
      const analytics = await AnalyticsModel.getAnalyticsByUrlId(urlRecord.id);
      
      if (!analytics) {
        // Return basic analytics if no detailed analytics exist
        return {
          short_code: shortCode,
          total_clicks: urlRecord.click_count,
          created_at: urlRecord.created_at.toISOString()
        };
      }

      return {
        short_code: shortCode,
        total_clicks: analytics.total_clicks,
        first_click_at: analytics.first_click_at?.toISOString(),
        last_click_at: analytics.last_click_at?.toISOString(),
        created_at: analytics.created_at.toISOString()
      };

    } catch (error) {
      console.error('Error getting analytics:', error);
      throw new Error('Failed to get analytics');
    }
  }

  /**
   * Get analytics summary for all URLs
   */
  static async getAnalyticsSummary(): Promise<{
    total_urls: number;
    total_clicks: number;
    active_urls: number;
    expired_urls: number;
  }> {
    try {
      // Get total URLs
      const totalUrlsQuery = 'SELECT COUNT(*) as count FROM urls';
      const totalUrlsResult = await pool.query(totalUrlsQuery);
      const total_urls = parseInt(totalUrlsResult.rows[0].count);

      // Get total clicks
      const totalClicksQuery = 'SELECT SUM(click_count) as total FROM urls';
      const totalClicksResult = await pool.query(totalClicksQuery);
      const total_clicks = parseInt(totalClicksResult.rows[0].total) || 0;

      // Get active URLs
      const activeUrlsQuery = 'SELECT COUNT(*) as count FROM urls WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())';
      const activeUrlsResult = await pool.query(activeUrlsQuery);
      const active_urls = parseInt(activeUrlsResult.rows[0].count);

      // Get expired URLs
      const expiredUrlsQuery = 'SELECT COUNT(*) as count FROM urls WHERE expires_at IS NOT NULL AND expires_at <= NOW()';
      const expiredUrlsResult = await pool.query(expiredUrlsQuery);
      const expired_urls = parseInt(expiredUrlsResult.rows[0].count);

      return {
        total_urls,
        total_clicks,
        active_urls,
        expired_urls
      };

    } catch (error) {
      console.error('Error getting analytics summary:', error);
      throw new Error('Failed to get analytics summary');
    }
  }

  /**
   * Get top performing URLs
   */
  static async getTopUrls(limit: number = 10): Promise<Array<{
    short_code: string;
    original_url: string;
    click_count: number;
    created_at: string;
  }>> {
    try {
      const query = `
        SELECT short_code, original_url, click_count, created_at
        FROM urls 
        WHERE is_active = true
        ORDER BY click_count DESC 
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);
      
      return result.rows.map(row => ({
        short_code: row.short_code,
        original_url: row.original_url,
        click_count: row.click_count,
        created_at: row.created_at.toISOString()
      }));

    } catch (error) {
      console.error('Error getting top URLs:', error);
      throw new Error('Failed to get top URLs');
    }
  }
}
