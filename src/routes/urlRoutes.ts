import { Router, Request, Response, NextFunction } from 'express';
import { UrlController } from '../controllers/UrlController';
import { 
  validateCreateShortUrl, 
  validateShortCode, 
  validatePagination 
} from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// URL Management Routes - POST routes first to avoid conflicts
router.post('/', validateCreateShortUrl, UrlController.createShortUrl);

// GET route for listing URLs (optional - for testing)
router.get('/', asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  res.json({
    success: true,
    message: 'URL Shortener API - Use POST to create short URLs',
    endpoints: {
      'Create Short URL': 'POST /api/v1/urls',
      'Get URL Details': 'GET /api/v1/urls/:shortCode',
      'Get Analytics': 'GET /api/v1/urls/:shortCode/analytics',
      'Get Product Data': 'GET /api/v1/urls/:shortCode/product'
    }
  });
}));

// Specific routes before parameterized routes
router.get('/:shortCode/analytics', validateShortCode, UrlController.getAnalytics);
router.get('/:shortCode/product', validateShortCode, UrlController.getProductData);
router.post('/:shortCode/product', validateShortCode, UrlController.scrapeProductData);
router.post('/:shortCode/product/refresh', validateShortCode, UrlController.refreshProductData);

// Parameterized route last to avoid conflicts
router.get('/:shortCode', validateShortCode, UrlController.getUrlDetails);

export default router;
