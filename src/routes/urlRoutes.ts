import { Router } from 'express';
import { UrlController } from '../controllers/UrlController';
import { 
  validateCreateShortUrl, 
  validateShortCode, 
  validatePagination 
} from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// URL Management Routes
router.post('/', validateCreateShortUrl, UrlController.createShortUrl);
router.get('/:shortCode', validateShortCode, UrlController.getUrlDetails);
router.get('/:shortCode/analytics', validateShortCode, UrlController.getAnalytics);

// Product Data Routes
router.get('/:shortCode/product', validateShortCode, UrlController.getProductData);
router.post('/:shortCode/product', validateShortCode, UrlController.scrapeProductData);
router.post('/:shortCode/product/refresh', validateShortCode, UrlController.refreshProductData);

export default router;
