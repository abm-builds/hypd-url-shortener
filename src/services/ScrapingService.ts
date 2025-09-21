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
      // HYPD specific selectors
      '.price-current',
      '.selling-price',
      '.product-price',
      '.price-amount',
      '[data-testid*="price"]',
      '[class*="price"][class*="current"]',
      '[class*="price"][class*="selling"]',
      '[class*="price"][class*="amount"]',
      // Generic selectors
      '.price',
      '.current-price',
      '.price-current',
      '[class*="price"]',
      'span[class*="price"]',
      'div[class*="price"]',
      // Look for ₹ symbol
      '*:contains("₹")',
      // Look for price patterns
      'span:contains("₹")',
      'div:contains("₹")'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        const priceText = element.text().trim();
        // Look for price patterns like ₹199, ₹1,999, etc.
        const priceMatch = priceText.match(/₹\s*[\d,]+/);
        if (priceMatch) {
          return priceMatch[0].replace(/\s/g, '');
        }
        // Clean up price text for other formats
        const cleanedPrice = priceText.replace(/[^\d.,₹$]/g, '').trim();
        if (cleanedPrice && /\d/.test(cleanedPrice)) {
          return cleanedPrice;
        }
      }
    }

    // Try to find price in any text containing currency symbols
    const allText = $.text();
    const priceMatches = allText.match(/₹\s*[\d,]+/g);
    if (priceMatches && priceMatches.length > 0) {
      return priceMatches[0].replace(/\s/g, '');
    }

    return undefined;
  }

  /**
   * Extract brand name from the page
   */
  private static extractBrandName($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      // HYPD specific selectors
      '.brand-name',
      '.product-brand',
      '.seller-name',
      '[data-testid*="brand"]',
      '[data-testid*="seller"]',
      '[class*="brand"]',
      '[class*="seller"]',
      // Generic selectors
      '.brand',
      '.product-brand',
      '[data-testid="brand"]',
      'span[class*="brand"]',
      'div[class*="brand"]',
      'span[class*="seller"]',
      'div[class*="seller"]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        let brandText = element.text().trim();
        
        // Clean up common prefixes/suffixes
        brandText = brandText
          .replace(/^Fulfilled by\s+/i, '')
          .replace(/^Visit\s+/i, '')
          .replace(/\s+Visit store.*$/i, '')
          .replace(/\s+Curated for you by.*$/i, '')
          .replace(/Personal Touch\s*/i, '')
          .replace(/Visit Brand\s*/i, '')
          .replace(/\s+-\s+.*$/i, '') // Remove everything after ' - '
          .replace(/\s+\d+ml.*$/i, '') // Remove '50ml' etc.
          .replace(/\s+Pack of \d+.*$/i, '') // Remove 'Pack of 1' etc.
          .trim();
        
        if (brandText && brandText.length > 2) {
          return brandText;
        }
      }
    }

    // Try to extract from product title if brand is part of it
    const title = this.extractProductName($);
    if (title && title.includes(' - ')) {
      let brandFromTitle = title.split(' - ')[0].trim();
      // Clean up the brand name from title
      brandFromTitle = brandFromTitle
        .replace(/\s+\d+ml.*$/i, '') // Remove '50ml' etc.
        .replace(/\s+Pack of \d+.*$/i, '') // Remove 'Pack of 1' etc.
        .replace(/\s+Deep\s+Cleansing.*$/i, '') // Remove 'Deep Cleansing' etc.
        .replace(/\s+Facewash.*$/i, '') // Remove 'Facewash' etc.
        .trim();
      
      if (brandFromTitle && brandFromTitle.length > 2) {
        return brandFromTitle;
      }
    }

    // Look for brand in meta tags
    const brandMeta = $('meta[property="product:brand"]').attr('content') ||
                     $('meta[name="brand"]').attr('content') ||
                     $('meta[property="og:brand"]').attr('content');
    
    if (brandMeta) {
      return brandMeta.trim();
    }

    return undefined;
  }

  /**
   * Extract featured image URL from the page
   */
  private static extractFeaturedImage($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      // HYPD specific selectors
      '.product-image img',
      '.main-product-image img',
      '.featured-image img',
      '.product-gallery img:first',
      '.product-photos img:first',
      '[data-testid*="product-image"] img',
      '[data-testid*="main-image"] img',
      '[class*="product"][class*="image"] img',
      '[class*="featured"][class*="image"] img',
      '[class*="main"][class*="image"] img',
      // Generic selectors
      '.product-image img',
      '.featured-image img',
      '[data-testid="product-image"] img',
      '.main-image img',
      '.product-gallery img:first',
      '[class*="product"][class*="image"] img',
      '[class*="featured"][class*="image"] img',
      // Look for high-resolution images
      'img[src*="product"]',
      'img[src*="featured"]',
      'img[src*="main"]',
      // Meta tags
      'meta[property="og:image"]',
      'meta[property="product:image"]',
      'link[rel="image_src"]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        let src: string | undefined;
        
        // Handle different element types
        if (element.is('img')) {
          src = element.attr('src') || element.attr('data-src') || element.attr('data-lazy');
        } else {
          // For meta tags and links
          src = element.attr('content') || element.attr('href');
        }
        
        if (src) {
          // Convert relative URLs to absolute
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            src = config.hypdBaseUrl + src;
          }
          
          // Validate that it's an image URL
          if (src.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
            return src;
          }
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
