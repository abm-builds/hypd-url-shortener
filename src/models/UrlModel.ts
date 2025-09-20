import { pool } from '../config/database';
import { UrlRecord, CreateShortUrlRequest } from '../types';
import { nanoid } from 'nanoid';
import { config } from '../config';

export class UrlModel {
  /**
   * Create a new short URL
   */
  static async createShortUrl(data: CreateShortUrlRequest, isHypdProduct: boolean = false): Promise<UrlRecord> {
    const shortCode = nanoid(config.shortUrlLength);
    const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
    
    const query = `
      INSERT INTO urls (short_code, original_url, is_hypd_product, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [shortCode, data.original_url, isHypdProduct, expiresAt];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating short URL:', error);
      throw new Error('Failed to create short URL');
    }
  }

  /**
   * Get URL by short code
   */
  static async getUrlByShortCode(shortCode: string): Promise<UrlRecord | null> {
    const query = `
      SELECT * FROM urls 
      WHERE short_code = $1 AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    `;
    
    try {
      const result = await pool.query(query, [shortCode]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting URL by short code:', error);
      throw new Error('Failed to retrieve URL');
    }
  }

  /**
   * Update click count for a URL
   */
  static async incrementClickCount(urlId: number): Promise<void> {
    const query = `
      UPDATE urls 
      SET click_count = click_count + 1 
      WHERE id = $1
    `;
    
    try {
      await pool.query(query, [urlId]);
    } catch (error) {
      console.error('Error updating click count:', error);
      throw new Error('Failed to update click count');
    }
  }

  /**
   * Get URL by ID
   */
  static async getUrlById(id: number): Promise<UrlRecord | null> {
    const query = 'SELECT * FROM urls WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting URL by ID:', error);
      throw new Error('Failed to retrieve URL');
    }
  }

  /**
   * Check if short code already exists
   */
  static async shortCodeExists(shortCode: string): Promise<boolean> {
    const query = 'SELECT id FROM urls WHERE short_code = $1';
    
    try {
      const result = await pool.query(query, [shortCode]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking short code existence:', error);
      throw new Error('Failed to check short code');
    }
  }

  /**
   * Get all URLs with pagination
   */
  static async getAllUrls(limit: number = 50, offset: number = 0): Promise<UrlRecord[]> {
    const query = `
      SELECT * FROM urls 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    try {
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error getting all URLs:', error);
      throw new Error('Failed to retrieve URLs');
    }
  }

  /**
   * Deactivate a URL
   */
  static async deactivateUrl(urlId: number): Promise<void> {
    const query = 'UPDATE urls SET is_active = false WHERE id = $1';
    
    try {
      await pool.query(query, [urlId]);
    } catch (error) {
      console.error('Error deactivating URL:', error);
      throw new Error('Failed to deactivate URL');
    }
  }
}
