import { pool } from '../config/database';
import { ProductDataRecord } from '../types';

export interface ProductScrapingData {
  product_name?: string;
  price?: string;
  brand_name?: string;
  featured_image_url?: string;
}

export class ProductDataModel {
  /**
   * Create product data record
   */
  static async createProductData(urlId: number, data: ProductScrapingData): Promise<ProductDataRecord> {
    const query = `
      INSERT INTO product_data (url_id, product_name, price, brand_name, featured_image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [urlId, data.product_name, data.price, data.brand_name, data.featured_image_url];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating product data:', error);
      throw new Error('Failed to create product data');
    }
  }

  /**
   * Update product data
   */
  static async updateProductData(urlId: number, data: ProductScrapingData): Promise<ProductDataRecord> {
    const query = `
      UPDATE product_data 
      SET 
        product_name = COALESCE($2, product_name),
        price = COALESCE($3, price),
        brand_name = COALESCE($4, brand_name),
        featured_image_url = COALESCE($5, featured_image_url),
        scraped_at = NOW()
      WHERE url_id = $1
      RETURNING *
    `;
    
    const values = [urlId, data.product_name, data.price, data.brand_name, data.featured_image_url];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating product data:', error);
      throw new Error('Failed to update product data');
    }
  }

  /**
   * Get product data by URL ID
   */
  static async getProductDataByUrlId(urlId: number): Promise<ProductDataRecord | null> {
    const query = 'SELECT * FROM product_data WHERE url_id = $1';
    
    try {
      const result = await pool.query(query, [urlId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting product data:', error);
      throw new Error('Failed to retrieve product data');
    }
  }

  /**
   * Get product data by short code
   */
  static async getProductDataByShortCode(shortCode: string): Promise<ProductDataRecord | null> {
    const query = `
      SELECT pd.* FROM product_data pd
      JOIN urls u ON pd.url_id = u.id
      WHERE u.short_code = $1
    `;
    
    try {
      const result = await pool.query(query, [shortCode]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting product data by short code:', error);
      throw new Error('Failed to retrieve product data');
    }
  }

  /**
   * Get or create product data
   */
  static async getOrCreateProductData(urlId: number, data: ProductScrapingData): Promise<ProductDataRecord> {
    let productData = await this.getProductDataByUrlId(urlId);
    
    if (!productData) {
      productData = await this.createProductData(urlId, data);
    } else {
      productData = await this.updateProductData(urlId, data);
    }
    
    return productData;
  }

  /**
   * Delete product data
   */
  static async deleteProductData(urlId: number): Promise<void> {
    const query = 'DELETE FROM product_data WHERE url_id = $1';
    
    try {
      await pool.query(query, [urlId]);
    } catch (error) {
      console.error('Error deleting product data:', error);
      throw new Error('Failed to delete product data');
    }
  }
}
