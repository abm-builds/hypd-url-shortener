import { Router } from 'express';
import { UrlController } from '../controllers/UrlController';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Analytics Routes
router.get('/summary', UrlController.getAnalyticsSummary);
router.get('/top', validatePagination, UrlController.getTopUrls);

export default router;
