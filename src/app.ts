import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import apiRoutes from './routes';
import { UrlController } from './controllers/UrlController';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.nodeEnv === 'production' ? false : true,
  credentials: true
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

// API routes
app.use(`/api/${config.apiVersion}`, apiRoutes);

// Short URL redirect route (must come before catch-all)
app.get('/:shortCode', UrlController.redirectToOriginalUrl);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'HYPD URL Shortener API',
    version: config.apiVersion,
    documentation: `${config.baseUrl}/api/${config.apiVersion}`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use(notFound);

export default app;
