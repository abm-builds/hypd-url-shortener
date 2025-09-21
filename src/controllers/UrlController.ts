import { Request, Response, NextFunction } from 'express';
import { UrlService } from '../services/UrlService';
import { AnalyticsService } from '../services/AnalyticsService';
import { ProductDataService } from '../services/ProductDataService';
import { asyncHandler } from '../middleware/errorHandler';
import { CreateShortUrlRequest } from '../types';

export class UrlController {
  /**
   * Create a short URL
   * POST /api/v1/urls
   */
  static createShortUrl = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data: CreateShortUrlRequest = req.body;

    const result = await UrlService.createShortUrl(data);

    // If it's a HYPD product, automatically scrape product data
    if (result.is_hypd_product) {
      try {
        console.log('Auto-scraping product data for HYPD URL...');
        await ProductDataService.scrapeAndStoreProductData(result.short_code);
        console.log('Product data scraped successfully');
      } catch (error) {
        console.error('Failed to auto-scrape product data:', error);
        // Don't fail the URL creation if scraping fails
      }
    }

    res.status(201).json({
      success: true,
      data: result
    });
  });

  /**
   * Get URL details
   * GET /api/v1/urls/:shortCode
   */
  static getUrlDetails = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { shortCode } = req.params;

    const result = await UrlService.getUrlDetails(shortCode);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'URL not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Redirect to original URL
   * GET /:shortCode
   */
  static redirectToOriginalUrl = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { shortCode } = req.params;
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip || req.connection.remoteAddress;

    const originalUrl = await UrlService.getOriginalUrl(shortCode);

    if (!originalUrl) {
      res.status(404).json({
        success: false,
        error: 'URL not found or expired'
      });
      return;
    }

    // Track the click
    try {
      await AnalyticsService.trackClick(shortCode, userAgent, ipAddress);
    } catch (error) {
      console.error('Failed to track click:', error);
      // Don't fail the redirect if analytics fails
    }

    res.redirect(originalUrl);
  });

  /**
   * Get analytics for a short URL
   * GET /api/v1/urls/:shortCode/analytics
   */
  static getAnalytics = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { shortCode } = req.params;

    const result = await AnalyticsService.getAnalytics(shortCode);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Analytics not found'
      });
      return;
    }

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Get product data for a HYPD URL
   * GET /api/v1/urls/:shortCode/product
   */
  static getProductData = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { shortCode } = req.params;

    const result = await ProductDataService.getProductData(shortCode);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Product data not found. This might not be a HYPD product URL.'
      });
      return;
    }

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Scrape and get product data for a HYPD URL
   * POST /api/v1/urls/:shortCode/product
   */
  static scrapeProductData = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { shortCode } = req.params;

    const result = await ProductDataService.scrapeAndStoreProductData(shortCode);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Failed to scrape product data. This might not be a HYPD product URL.'
      });
      return;
    }

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Refresh product data
   * POST /api/v1/urls/:shortCode/product/refresh
   */
  static refreshProductData = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { shortCode } = req.params;

    const result = await ProductDataService.refreshProductData(shortCode);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Failed to refresh product data. This might not be a HYPD product URL.'
      });
      return;
    }

    res.json({
      success: true,
      data: result,
      message: 'Product data refreshed successfully'
    });
  });

  /**
   * Get analytics summary
   * GET /api/v1/analytics/summary
   */
  static getAnalyticsSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await AnalyticsService.getAnalyticsSummary();

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Get top performing URLs
   * GET /api/v1/analytics/top
   */
  static getTopUrls = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { limit } = req.query;
    const topLimit = limit ? parseInt(limit as string) : 10;

    const result = await AnalyticsService.getTopUrls(topLimit);

    res.json({
      success: true,
      data: result
    });
  });
}
