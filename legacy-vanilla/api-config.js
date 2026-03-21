/**
 * API Configuration for livescoreFree.online v2.0
 * 
 * Defines API endpoints and base URLs based on environment
 * Can use either direct external APIs or proxied Cloudflare endpoints
 * 
 * @version 2.0
 * @updated 2026-03-20
 * @domain livescoreFree.online
 */

// ===== CONFIGURATION =====

// Set to true to use Cloudflare Pages Functions.
// Set to false to use external APIs directly (ESPN, TheSportsDB).
const USE_CLOUDFLARE_PROXY = true;

// Supported hosts for production and preview environments.
const PRODUCTION_DOMAINS = ["livescoreFree.online", "www.livescoreFree.online", "api.livescoreFree.online"];

function isProductionHost(hostname) {
  return PRODUCTION_DOMAINS.includes(hostname) || hostname.endsWith(".pages.dev");
}

function getProxyBaseUrl() {
  const explicitBaseUrl = typeof window.__LIVESCORE_API_BASE_URL__ === "string"
    ? window.__LIVESCORE_API_BASE_URL__.trim()
    : "";

  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/+$/, "");
  }

  return window.location.origin.replace(/\/+$/, "");
}

// Environment detection
const isProduction = isProductionHost(window.location.hostname);
const isDevelopment = !isProduction;

// ===== API ENDPOINTS =====

const API_CONFIG = {
  // Development: Use external APIs directly (no proxy needed)
  development: {
    live: {
      baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
      fallback: 'https://www.thesportsdb.com/api/v1/json/123',
      ttl: 15000, // 15 seconds
    },
    timeline: {
      baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
      fallback: 'https://www.thesportsdb.com/api/v1/json/123',
      ttl: 10000, // 10 seconds
    },
    standings: {
      baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
      fallback: 'https://www.thesportsdb.com/api/v1/json/123',
      ttl: 3600000, // 1 hour
    }
  },

  // Production: Use Cloudflare proxy by default
  production: {
    live: {
      endpoint: '/api/live',
      ttl: 15000, // 15 seconds
      corsEnabled: true,
      credentials: 'omit'
    },
    timeline: {
      endpoint: '/api/timeline',
      ttl: 10000, // 10 seconds
      corsEnabled: true,
      credentials: 'omit'
    },
    standings: {
      endpoint: '/api/standings',
      ttl: 3600000, // 1 hour
      corsEnabled: true,
      credentials: 'omit'
    }
  }
};

// ===== HELPER FUNCTIONS =====

/**
 * Get configuration for current environment
 */
function getApiConfig() {
  return isDevelopment ? API_CONFIG.development : API_CONFIG.production;
}

/**
 * Build API request URL
 */
function buildApiUrl(endpoint, params = {}) {
  const config = getApiConfig();
  const endpointConfig = config[endpoint];
  
  if (!endpointConfig) {
    throw new Error(`Unknown endpoint: ${endpoint}`);
  }

  let url;
  
  if (isProduction && USE_CLOUDFLARE_PROXY) {
    // Production: Use the current deployment origin unless explicitly overridden.
    url = `${getProxyBaseUrl()}${endpointConfig.endpoint}`;
    
    // Add query parameters
    const queryString = new URLSearchParams(params).toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  } else {
    // Development: Use external APIs directly
    // This requires implementing the calls differently
    // (Falls back to ESPN/TheSportsDB directly in app.js)
    url = endpointConfig.baseUrl;
  }

  return url;
}

/**
 * Fetch with error handling and fallback
 */
async function fetchWithFallback(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    throw error;
  }
}

/**
 * Get cache configuration for endpoint
 */
function getCacheTtl(endpoint) {
  const config = getApiConfig();
  const endpointConfig = config[endpoint];
  return endpointConfig ? endpointConfig.ttl : 15000;
}

// ===== EXPORT FUNCTIONS =====

const LiveScoreAPI = {
  /**
   * Fetch live matches
   * @param {Object} options - Options (sport, limit)
   * @returns {Promise<Array>}
   */
  async getLive(options = {}) {
    const url = buildApiUrl('live', options);
    return fetchWithFallback(url);
  },

  /**
   * Fetch match timeline
   * @param {string} matchId - Match ID
   * @returns {Promise<Array>}
   */
  async getTimeline(matchId) {
    const url = buildApiUrl('timeline', { match: matchId });
    return fetchWithFallback(url);
  },

  /**
   * Fetch league standings
   * @param {string} league - League ID
   * @returns {Promise<Array>}
   */
  async getStandings(league) {
    const url = buildApiUrl('standings', { league });
    return fetchWithFallback(url);
  },

  /**
   * Get cache TTL for endpoint
   * @param {string} endpoint - Endpoint name
   * @returns {number} TTL in milliseconds
   */
  getCacheTtl(endpoint) {
    return getCacheTtl(endpoint);
  },

  /**
   * Check if using Cloudflare proxy
   * @returns {boolean}
   */
  isUsingProxy() {
    return isProduction && USE_CLOUDFLARE_PROXY;
  },

  /**
   * Get API configuration
   * @returns {Object}
   */
  getConfig() {
    return {
      environment: isDevelopment ? 'development' : 'production',
      config: getApiConfig(),
      usingProxy: this.isUsingProxy()
    };
  }
};

// ===== ENVIRONMENT VARIABLES =====

// Allow configuration via browser console or script
if (window.__LIVESCORE_API_CONFIG__) {
  Object.assign(API_CONFIG, window.__LIVESCORE_API_CONFIG__);
}

// Make available globally
window.LiveScoreAPI = LiveScoreAPI;

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LiveScoreAPI;
}




