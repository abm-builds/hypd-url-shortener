import { Router } from 'express';
import { config } from '../config';
import urlRoutes from './urlRoutes';
import analyticsRoutes from './analyticsRoutes';

const router = Router();

// API Info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HYPD URL Shortener API',
    version: config.apiVersion,
    endpoints: {
      urls: `${config.baseUrl}/api/${config.apiVersion}/urls`,
      analytics: `${config.baseUrl}/api/${config.apiVersion}/analytics`,
      health: `${config.baseUrl}/health`
    },
    documentation: {
      'Create Short URL': {
        method: 'POST',
        url: '/api/v1/urls',
        body: {
          original_url: 'string (required)',
          expires_at: 'string (optional, ISO date)'
        }
      },
      'Get URL Details': {
        method: 'GET',
        url: '/api/v1/urls/:shortCode'
      },
      'Redirect to Original': {
        method: 'GET',
        url: '/:shortCode'
      },
      'Get Analytics': {
        method: 'GET',
        url: '/api/v1/urls/:shortCode/analytics'
      },
      'Get Product Data': {
        method: 'GET',
        url: '/api/v1/urls/:shortCode/product'
      },
      'Scrape Product Data': {
        method: 'POST',
        url: '/api/v1/urls/:shortCode/product'
      },
      'Refresh Product Data': {
        method: 'POST',
        url: '/api/v1/urls/:shortCode/product/refresh'
      },
      'Analytics Summary': {
        method: 'GET',
        url: '/api/v1/analytics/summary'
      },
      'Top URLs': {
        method: 'GET',
        url: '/api/v1/analytics/top?limit=10'
      }
    }
  });
});

// Mount route modules
router.use('/urls', urlRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
