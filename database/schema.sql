-- Create the database (run this separately if needed)
-- CREATE DATABASE hypd_url_shortener;

-- Create tables for URL shortener service

-- URLs table to store original and shortened URLs
CREATE TABLE IF NOT EXISTS urls (
    id SERIAL PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    click_count INTEGER DEFAULT 0,
    created_by_ip VARCHAR(45), -- Store IP for analytics
    created_by_user_agent TEXT -- Store user agent for analytics
);

-- Analytics table to track clicks
CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer TEXT,
    country VARCHAR(2), -- ISO country code
    city VARCHAR(100)
);

-- Product data table for HYPD products
CREATE TABLE IF NOT EXISTS product_data (
    id SERIAL PRIMARY KEY,
    url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
    product_name TEXT,
    price DECIMAL(10,2),
    brand_name VARCHAR(255),
    featured_image_url TEXT,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB -- Store additional scraped data
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at);
CREATE INDEX IF NOT EXISTS idx_urls_expires_at ON urls(expires_at);
CREATE INDEX IF NOT EXISTS idx_analytics_url_id ON analytics(url_id);
CREATE INDEX IF NOT EXISTS idx_analytics_clicked_at ON analytics(clicked_at);
CREATE INDEX IF NOT EXISTS idx_product_data_url_id ON product_data(url_id);

-- Function to clean up expired URLs (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_urls()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE urls SET is_active = FALSE WHERE expires_at < CURRENT_TIMESTAMP AND is_active = TRUE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
