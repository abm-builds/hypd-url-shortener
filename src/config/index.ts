import dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiVersion: process.env.API_VERSION || 'v1',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  defaultExpiryDays: parseInt(process.env.DEFAULT_EXPIRY_DAYS || '30', 10),
  shortUrlLength: parseInt(process.env.SHORT_URL_LENGTH || '6', 10),
  hypdBaseUrl: process.env.HYPD_BASE_URL || 'https://www.hypd.store'
};

// Validation
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}