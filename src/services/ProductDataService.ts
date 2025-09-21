import { ProductDataModel, ProductScrapingData } from '../models/ProductDataModel';
import { ScrapingService } from './ScrapingService';
import { UrlModel } from '../models/UrlModel';
import { ProductDataResponse } from '../types';
import { pool } from '../config/database';
import { CustomError } from '../middleware/errorHandler';

export class ProductDataService {
  /**
   * Scrape and store product data for a HYPD URL
   */
  static async scrapeAndStoreProductData(shortCode: string): Promise<ProductDataResponse | null> {
    try {
      // Get URL record
      const urlRecord = await UrlModel.getUrlByShortCode(shortCode);
      
      if (!urlRecord) {
        throw new Error('URL not found');
      }

      // Check if it's a HYPD product
      if (!urlRecord.is_hypd_product) {
        throw new CustomError('URL is not a HYPD product', 400);
      }

      // Check if product data already exists
      let productData = await ProductDataModel.getProductDataByUrlId(urlRecord.id);
      
      // If data exists and was scraped recently (within 24 hours), return cached data
      if (productData && this.isDataRecent(productData.scraped_at)) {
        console.log('Returning cached product data');
        return this.formatProductDataResponse(productData);
      }

      // Scrape fresh data
      console.log('Scraping fresh product data');
      const scrapedData = await ScrapingService.scrapeHypdProduct(urlRecord.original_url);
      
      // Store or update product data
      productData = await ProductDataModel.getOrCreateProductData(urlRecord.id, scrapedData);
      
      return this.formatProductDataResponse(productData);

    } catch (error) {
      console.error('Error scraping and storing product data:', error);
      
      // If it's already a CustomError, re-throw it
      if (error instanceof CustomError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new CustomError(`Failed to get product data: ${errorMessage}`, 500);
    }
  }

  /**
   * Get product data for a short code
   */
  static async getProductData(shortCode: string): Promise<ProductDataResponse | null> {
    try {
      const productData = await ProductDataModel.getProductDataByShortCode(shortCode);
      
      if (!productData) {
        return null;
      }

      return this.formatProductDataResponse(productData);

    } catch (error) {
      console.error('Error getting product data:', error);
      throw new Error('Failed to get product data');
    }
  }

  /**
   * Force refresh product data
   */
  static async refreshProductData(shortCode: string): Promise<ProductDataResponse | null> {
    try {
      // Get URL record
      const urlRecord = await UrlModel.getUrlByShortCode(shortCode);
      
      if (!urlRecord || !urlRecord.is_hypd_product) {
        throw new CustomError('URL is not a HYPD product', 400);
      }

      // Scrape fresh data
      const scrapedData = await ScrapingService.scrapeHypdProduct(urlRecord.original_url);
      
      // Update product data
      const productData = await ProductDataModel.updateProductData(urlRecord.id, scrapedData);
      
      return this.formatProductDataResponse(productData);

    } catch (error) {
      console.error('Error refreshing product data:', error);
      
      // If it's already a CustomError, re-throw it
      if (error instanceof CustomError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new CustomError(`Failed to refresh product data: ${errorMessage}`, 500);
    }
  }

  /**
   * Check if product data is recent (within 24 hours)
   */
  private static isDataRecent(scrapedAt: Date): boolean {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    return scrapedAt > twentyFourHoursAgo;
  }

  /**
   * Format product data for API response
   */
  private static formatProductDataResponse(productData: any): ProductDataResponse {
    return {
      product_name: productData.product_name,
      price: productData.price,
      brand_name: productData.brand_name,
      featured_image_url: productData.featured_image_url,
      scraped_at: productData.scraped_at.toISOString()
    };
  }

  /**
   * Get all product data with pagination
   */
  static async getAllProductData(limit: number = 50, offset: number = 0): Promise<ProductDataResponse[]> {
    try {
      const query = `
        SELECT pd.*, u.short_code, u.original_url
        FROM product_data pd
        JOIN urls u ON pd.url_id = u.id
        WHERE u.is_hypd_product = true
        ORDER BY pd.scraped_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await pool.query(query, [limit, offset]);
      
      return result.rows.map(row => this.formatProductDataResponse(row));

    } catch (error) {
      console.error('Error getting all product data:', error);
      throw new Error('Failed to get product data');
    }
  }

  /**
   * Delete product data for a URL
   */
  static async deleteProductData(shortCode: string): Promise<void> {
    try {
      const urlRecord = await UrlModel.getUrlByShortCode(shortCode);
      
      if (!urlRecord) {
        throw new Error('URL not found');
      }

      await ProductDataModel.deleteProductData(urlRecord.id);

    } catch (error) {
      console.error('Error deleting product data:', error);
      throw new Error('Failed to delete product data');
    }
  }
}
