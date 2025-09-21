import { UrlModel } from '../models/UrlModel';
import { CreateShortUrlRequest, CreateShortUrlResponse, HypdProductInfo } from '../types';
import { config } from '../config';
import { nanoid } from 'nanoid';

export class UrlService {
  /**
   * Detect if URL is a HYPD product URL
   */
  static detectHypdProduct(url: string): HypdProductInfo {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a HYPD domain
      const isHypdDomain = urlObj.hostname.includes('hypd.store');
      
      if (!isHypdDomain) {
        return { isHypdProduct: false };
      }
      
      // Check if it's a product URL pattern
      const isProductUrl = urlObj.pathname.includes('/hypd_store/product/');
      
      if (!isProductUrl) {
        return { isHypdProduct: false };
      }
      
      // Extract product ID from URL
      const pathParts = urlObj.pathname.split('/');
      const productIndex = pathParts.findIndex(part => part === 'product');
      
      if (productIndex !== -1 && pathParts[productIndex + 1]) {
        const productId = pathParts[productIndex + 1];
        
        // Extract title from query params if available
        const title = urlObj.searchParams.get('title') || undefined;
        
        return {
          isHypdProduct: true,
          productId,
          title
        };
      }
      
      return { isHypdProduct: false };
    } catch (error) {
      console.error('Error detecting HYPD product:', error);
      return { isHypdProduct: false };
    }
  }

  /**
   * Validate URL format
   */
  static validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a short URL
   */
  static async createShortUrl(data: CreateShortUrlRequest): Promise<CreateShortUrlResponse> {
    // Validate URL
    if (!this.validateUrl(data.original_url)) {
      throw new Error('Invalid URL format');
    }

    // Detect if it's a HYPD product
    const hypdInfo = this.detectHypdProduct(data.original_url);
    
    // Create short URL in database
    const urlRecord = await UrlModel.createShortUrl(data, hypdInfo.isHypdProduct);
    
    // Build response
    const response: CreateShortUrlResponse = {
      short_code: urlRecord.short_code,
      short_url: `${config.baseUrl}/${urlRecord.short_code}`,
      original_url: urlRecord.original_url,
      is_hypd_product: urlRecord.is_hypd_product,
      expires_at: urlRecord.expires_at?.toISOString(),
      created_at: urlRecord.created_at.toISOString()
    };

    return response;
  }

  /**
   * Get original URL by short code
   */
  static async getOriginalUrl(shortCode: string): Promise<string | null> {
    const urlRecord = await UrlModel.getUrlByShortCode(shortCode);
    
    if (!urlRecord) {
      return null;
    }

    // Update click count
    await UrlModel.incrementClickCount(urlRecord.id);
    
    return urlRecord.original_url;
  }

  /**
   * Get URL details by short code
   */
  static async getUrlDetails(shortCode: string) {
    const urlRecord = await UrlModel.getUrlByShortCode(shortCode);
    
    if (!urlRecord) {
      return null;
    }

    return {
      short_code: urlRecord.short_code,
      short_url: `${config.baseUrl}/${urlRecord.short_code}`,
      original_url: urlRecord.original_url,
      is_hypd_product: urlRecord.is_hypd_product,
      expires_at: urlRecord.expires_at?.toISOString(),
      click_count: urlRecord.click_count,
      is_active: urlRecord.is_active,
      created_at: urlRecord.created_at.toISOString()
    };
  }

  /**
   * Check if short code is available
   */
  static async isShortCodeAvailable(shortCode: string): Promise<boolean> {
    const exists = await UrlModel.shortCodeExists(shortCode);
    return !exists;
  }

  /**
   * Generate a unique short code
   */
  static async generateUniqueShortCode(): Promise<string> {
    let shortCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      shortCode = nanoid(config.shortUrlLength);
      const isAvailable = await this.isShortCodeAvailable(shortCode);
      
      if (isAvailable) {
        return shortCode;
      }
      
      attempts++;
    } while (attempts < maxAttempts);

    throw new Error('Failed to generate unique short code');
  }
}
