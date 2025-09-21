// Database Models
export interface UrlRecord {
  id: number;
  short_code: string;
  original_url: string;
  is_hypd_product: boolean;
  created_at: Date;
  expires_at?: Date;
  is_active: boolean;
  click_count: number;
}

export interface AnalyticsRecord {
  id: number;
  url_id: number;
  first_click_at?: Date;
  last_click_at?: Date;
  total_clicks: number;
  created_at: Date;
}

export interface ProductDataRecord {
  id: number;
  url_id: number;
  product_name?: string;
  price?: string;
  brand_name?: string;
  featured_image_url?: string;
  scraped_at: Date;
  created_at: Date;
}

// API Request/Response Types
export interface CreateShortUrlRequest {
  original_url: string;
  expires_at?: string; // ISO date string
}

export interface CreateShortUrlResponse {
  short_code: string;
  short_url: string;
  original_url: string;
  is_hypd_product: boolean;
  expires_at?: string;
  created_at: string;
}

export interface ProductDataResponse {
  product_name?: string;
  price?: string;
  brand_name?: string;
  featured_image_url?: string;
  scraped_at: string;
}

export interface AnalyticsResponse {
  short_code: string;
  total_clicks: number;
  first_click_at?: string;
  last_click_at?: string;
  created_at: string;
}

// HYPD Product Detection
export interface HypdProductInfo {
  isHypdProduct: boolean;
  productId?: string;
  title?: string;
}

// Environment Configuration
export interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  baseUrl: string;
  apiVersion: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  defaultExpiryDays: number;
  shortUrlLength: number;
  hypdBaseUrl: string;
}
