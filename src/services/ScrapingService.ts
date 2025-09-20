import axios from 'axios';
import * as cheerio from 'cheerio';
import { ProductScrapingData } from '../models/ProductDataModel';
import { config } from '../config';

export class ScrapingService {
  /**
   * Scrape HYPD product page
   */
  static async scrapeHypdProduct(url: string): Promise<ProductScrapingData> {
    try {
      console.log(`Scraping HYPD product: ${url}`);
      
      // Set headers to mimic a real browser
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      };

      const response = await axios.get(url, {
        headers,
        timeout: 10000, // 10 second timeout
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      // Extract product information
      const productData: ProductScrapingData = {};

      // Product Name - Try multiple selectors
      productData.product_name = this.extractProductName($);
      
      // Price - Try multiple selectors
      productData.price = this.extractPrice($);
      
      // Brand Name - Try multiple selectors
      productData.brand_name = this.extractBrandName($);
      
      // Featured Image - Try multiple selectors
      productData.featured_image_url = this.extractFeaturedImage($);

      console.log('Scraped product data:', productData);
      return productData;

    } catch (error) {
      console.error('Error scraping HYPD product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to scrape product data: ${errorMessage}`);
    }
  }

  /**
   * Extract product name from the page
   */
  private static extractProductName($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      'h1.product-title',
      'h1[data-testid="product-title"]',
      '.product-details h1',
      '.product-info h1',
      'h1',
      '.title',
      '[class*="product"][class*="title"]',
      '[class*="title"]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }

    return undefined;
  }

  /**
   * Extract price from the page
   */
  private static extractPrice($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      '.price',
      '.product-price',
      '[data-testid="price"]',
      '.current-price',
      '.selling-price',
      '.price-current',
      '[class*="price"]',
      'span[class*="price"]',
      'div[class*="price"]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        const priceText = element.text().trim();
        // Clean up price text
        const cleanedPrice = priceText.replace(/[^\d.,₹$]/g, '').trim();
        if (cleanedPrice) {
          return cleanedPrice;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract brand name from the page
   */
  private static extractBrandName($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      '.brand',
      '.product-brand',
      '[data-testid="brand"]',
      '.brand-name',
      '[class*="brand"]',
      'span[class*="brand"]',
      'div[class*="brand"]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }

    // Try to extract from product title if brand is part of it
    const title = this.extractProductName($);
    if (title && title.includes(' - ')) {
      return title.split(' - ')[0].trim();
    }

    return undefined;
  }

  /**
   * Extract featured image URL from the page
   */
  private static extractFeaturedImage($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      '.product-image img',
      '.featured-image img',
      '[data-testid="product-image"] img',
      '.main-image img',
      '.product-gallery img:first',
      '[class*="product"][class*="image"] img',
      '[class*="featured"][class*="image"] img'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        let src = element.attr('src') || element.attr('data-src') || element.attr('data-lazy');
        
        if (src) {
          // Convert relative URLs to absolute
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            src = config.hypdBaseUrl + src;
          }
          
          return src;
        }
      }
    }

    return undefined;
  }

  /**
   * Validate if URL is accessible
   */
  static async validateUrlAccessibility(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        maxRedirects: 3
      });
      
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      console.error('URL accessibility check failed:', error);
      return false;
    }
  }

  /**
   * Get page title
   */
  static async getPageTitle(url: string): Promise<string | undefined> {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        maxRedirects: 3
      });

      const $ = cheerio.load(response.data);
      return $('title').text().trim() || undefined;
    } catch (error) {
      console.error('Error getting page title:', error);
      return undefined;
    }
  }
}
