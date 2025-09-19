require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'hypd_url_shortener',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    url: process.env.DATABASE_URL,
  },
  
  // Application Configuration
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  shortCodeLength: parseInt(process.env.SHORT_CODE_LENGTH) || 6,
  defaultExpiryDays: parseInt(process.env.DEFAULT_EXPIRY_DAYS) || 30,
  
  // HYPD Configuration
  hypdBaseUrl: process.env.HYPD_BASE_URL || 'https://www.hypd.store',
  
  // Security Configuration
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = config;
