/**
 * Generate a random short code for URL shortening
 * @param {number} length - Length of the short code
 * @returns {string} Generated short code
 */
function generateShortCode(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Check if a URL is a valid HTTP/HTTPS URL
 * @param {string} url - URL to validate
 * @returns {boolean} Whether the URL is valid
 */
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a HYPD product URL
 * @param {string} url - URL to check
 * @returns {boolean} Whether the URL is a HYPD product URL
 */
function isHypdProductUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.hypd.store' && urlObj.pathname.includes('/product/');
  } catch {
    return false;
  }
}

/**
 * Normalize URL by adding protocol if missing
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
function normalizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Generate expiry date based on days from now
 * @param {number} days - Number of days from now
 * @returns {Date} Expiry date
 */
function generateExpiryDate(days = 30) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
}

module.exports = {
  generateShortCode,
  isValidUrl,
  isHypdProductUrl,
  normalizeUrl,
  generateExpiryDate
};
