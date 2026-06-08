/**
 * MangaDex API Client
 * Handles all API requests with rate limiting, retry logic, and proper headers
 */

const API_BASE = 'https://api.mangadex.org';
const USER_AGENT = 'MangaView/1.0.0 (Anime Website; +https://github.com/mangadex-fans/mangaview)';

// 图片代理地址 - 使用 corsproxy.io 的 url 参数格式
const IMAGE_PROXY_BASE = 'https://corsproxy.io/?url=';

// Rate limiter: 5 requests per second globally
class RateLimiter {
  constructor(maxRequests = 5, windowMs = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.queue = [];
    this.processing = false;
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      if (!this.processing) {
        this.process();
      }
    });
  }

  async process() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const { requestFn, resolve, reject } = this.queue.shift();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    }

    // Wait for the rate limit window
    setTimeout(() => this.process(), this.windowMs / this.maxRequests);
  }
}

const rateLimiter = new RateLimiter();

// X-Request-ID storage for debugging
const requestIds = new Map();

async function apiRequest(endpoint, options = {}) {
  const { method = 'GET', body, params, headers = {} } = options;

  // Build URL with query params
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          // Append array values with bracket notation: key[]=value1&key[]=value2
          value.forEach(item => {
            url.searchParams.append(`${key}[]`, item);
          });
        } else {
          url.searchParams.append(key, value);
        }
      }
    });
  }

  // Build headers
  const requestHeaders = {
    'User-Agent': USER_AGENT,
    'Content-Type': 'application/json',
    ...headers,
  };

  // Make request through rate limiter
  const response = await rateLimiter.add(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(url.toString(), {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  });

  // Store X-Request-ID for debugging
  const requestId = response.headers.get('X-Request-ID');
  if (requestId) {
    requestIds.set(Date.now(), requestId);
  }

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('X-RateLimit-Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
    console.warn(`Rate limited. Waiting ${waitTime}ms. Request ID: ${requestId}`);
    await new Promise(r => setTimeout(r, waitTime));
    return apiRequest(endpoint, options); // Retry
  }

  if (response.status >= 400) {
    const errorBody = await response.text();
    console.error(`API Error ${response.status}. Request ID: ${requestId}`, errorBody);
    throw new Error(`API Error ${response.status}${requestId ? ` (Request ID: ${requestId})` : ''}`);
  }

  return response.json();
}

// ============ API Endpoints ============

// Manga endpoints
export const manga = {
  /**
   * Get list of manga with optional filters
   * @param {Object} params - Query parameters
   */
  async list(params = {}) {
    return apiRequest('/manga', { params: {
      limit: params.limit || 24,
      offset: params.offset || 0,
      title: params.title,
      author: params.author,
      artist: params.artist,
      year: params.year,
      status: params.status,
      'originalLanguage[]': params.originalLanguage,
      'excludedOriginalLanguage[]': params.excludedOriginalLanguage,
      'availableTranslatedLanguage[]': params.availableTranslatedLanguage,
      'publicationDemographic[]': params.publicationDemographic,
      'contentRating[]': params.contentRating,
      'tags[]': params.tags,
      'excludedTags[]': params.excludedTags,
      'status[]': params.status,
      'order[title]': params['order[title]'],
      'order[year]': params['order[year]'],
      'order[latestUploadedChapter]': params['order[latestUploadedChapter]'],
      'order[followedCount]': params['order[followedCount]'],
      'order[createdAt]': params['order[createdAt]'],
      'order[updatedAt]': params['order[updatedAt]'],
      includes: params.includes || ['author', 'artist', 'cover_art', 'tag'],
      ...params,
    }});
  },

  /**
   * Get manga details by ID
   * @param {string} id - Manga ID
   * @param {Object} params - Query parameters
   */
  async get(id, params = {}) {
    return apiRequest(`/manga/${id}`, { params: {
      includes: params.includes || ['author', 'artist', 'cover_art', 'tag', 'scanlation_group'],
      ...params,
    }});
  },

  /**
   * Get random manga
   */
  async random() {
    return apiRequest('/manga/random', { params: {
      includes: ['author', 'artist', 'cover_art', 'tag'],
    }});
  },

  /**
   * Get manga's chapter feed
   * @param {string} id - Manga ID
   * @param {Object} params - Query parameters
   */
  async getFeed(id, params = {}) {
    return apiRequest(`/manga/${id}/feed`, { params: {
      limit: params.limit || 100,
      offset: params.offset || 0,
      'translatedLanguage[]': params.translatedLanguage || ['en'],
      'order[chapter]': params['order[chapter]'] || 'asc',
      'order[createdAt]': params['order[createdAt]'] || 'asc',
      'order[publishAt]': params['order[publishAt]'] || 'asc',
      includes: params.includes || ['scanlation_group', 'user'],
      ...params,
    }});
  },

  /**
   * Get all tags
   */
  async getTags() {
    return apiRequest('/manga/tag', { params: { limit: 100 } });
  },
};

// Chapter endpoints
export const chapter = {
  /**
   * Get chapter details by ID
   * @param {string} id - Chapter ID
   * @param {Object} params - Query parameters
   */
  async get(id, params = {}) {
    return apiRequest(`/chapter/${id}`, { params: {
      includes: params.includes || ['manga', 'scanlation_group', 'user'],
      ...params,
    }});
  },

  /**
   * Search chapters
   * @param {Object} params - Query parameters
   */
  async list(params = {}) {
    return apiRequest('/chapter', { params: {
      limit: params.limit || 24,
      offset: params.offset || 0,
      'manga[]': params.manga,
      'ids[]': params.ids,
      'group[]': params.group,
      'uploader[]': params.uploader,
      'translatedLanguage[]': params.translatedLanguage || ['en'],
      'originalLanguage[]': params.originalLanguage,
      'excludedOriginalLanguage[]': params.excludedOriginalLanguage,
      'publicationDemographic[]': params.publicationDemographic,
      'contentRating[]': params.contentRating,
      'order[chapter]': params['order[chapter]'],
      'order[createdAt]': params['order[createdAt]'] || 'asc',
      'order[publishAt]': params['order[publishAt]'] || 'asc',
      includes: params.includes || ['manga', 'scanlation_group'],
      ...params,
    }});
  },

  /**
   * Mark chapter as read
   * @param {string} id - Chapter ID
   */
  async markRead(id) {
    return apiRequest(`/chapter/${id}/read`, { method: 'POST' });
  },

  /**
   * Get MangaDex@Home server for chapter
   * @param {string} id - Chapter ID
   */
  async getAtHomeServer(id) {
    return apiRequest(`/at-home/server/${id}`);
  },
};

// Author endpoints
export const author = {
  /**
   * Get author details by ID
   * @param {string} id - Author ID
   * @param {Object} params - Query parameters
   */
  async get(id, params = {}) {
    return apiRequest(`/author/${id}`, { params });
  },

  /**
   * Search authors
   * @param {Object} params - Query parameters
   */
  async list(params = {}) {
    return apiRequest('/author', { params: {
      limit: params.limit || 24,
      offset: params.offset || 0,
      name: params.name,
      ...params,
    }});
  },
};

// Group endpoints
export const group = {
  /**
   * Get scanlation group details by ID
   * @param {string} id - Group ID
   * @param {Object} params - Query parameters
   */
  async get(id, params = {}) {
    return apiRequest(`/group/${id}`, { params });
  },

  /**
   * Search scanlation groups
   * @param {Object} params - Query parameters
   */
  async list(params = {}) {
    return apiRequest('/group', { params: {
      limit: params.limit || 24,
      offset: params.offset || 0,
      name: params.name,
      ...params,
    }});
  },
};

// Cover endpoints
export const cover = {
  /**
   * Get cover details by ID
   * @param {string} id - Cover ID
   * @param {Object} params - Query parameters
   */
  async get(id, params = {}) {
    return apiRequest(`/cover/${id}`, { params });
  },

  /**
   * Search covers
   * @param {Object} params - Query parameters
   */
  async list(params = {}) {
    return apiRequest('/cover', { params: {
      limit: params.limit || 24,
      offset: params.offset || 0,
      'manga[]': params.manga,
      ...params,
    }});
  },
};

// ============ Utility Functions ============

/**
 * Get cover image URL with size
 * Uses the uploads.mangadex.org domain with optional CORS proxy
 * @param {Object} cover - Cover object from API
 * @param {'original' | '512' | '256'} size - Image size
 * @returns {string} Image URL
 */
export function getCoverUrl(cover, size = '512') {
  if (!cover?.attributes?.fileName) {
    return ''; // 返回空字符串，使用 CSS 占位符
  }
  const fileName = cover.attributes.fileName;
  const originalUrl = `https://uploads.mangadex.org/covers/${fileName}`;

  // 如果配置了图片代理，使用代理
  if (IMAGE_PROXY_BASE) {
    return `${IMAGE_PROXY_BASE}${encodeURIComponent(originalUrl)}`;
  }

  // 否则返回原始 URL（会被浏览器阻止，但不会报错）
  return originalUrl;
}

/**
 * Get localized text from attributes
 * @param {Object} attributes - Attributes object with localized fields
 * @param {string} preferredLang - Preferred language code
 * @returns {string} Localized text
 */
export function getLocalizedText(attributes, field, preferredLang = 'en') {
  if (!attributes?.[field]) return '';

  const fieldData = attributes[field];
  if (typeof fieldData === 'string') return fieldData;
  if (typeof fieldData === 'object') {
    return fieldData[preferredLang] || fieldData['en'] || Object.values(fieldData)[0] || '';
  }
  return '';
}

/**
 * Get relationship by type
 * @param {Array} relationships - Relationships array
 * @param {string} type - Relationship type
 * @returns {Object|null} Related object
 */
export function getRelationship(relationships, type) {
  return relationships?.find(r => r.type === type) || null;
}

/**
 * Format date to relative time
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

/**
 * Get content rating badge class
 * @param {string} rating - Content rating
 * @returns {string} CSS class name
 */
export function getContentRatingClass(rating) {
  const map = {
    safe: 'manga-card__rating--safe',
    suggestive: 'manga-card__rating--suggestive',
    erotica: 'manga-card__rating--erotica',
    pornographic: 'manga-card__rating--pornographic',
  };
  return map[rating] || 'manga-card__rating--safe';
}

/**
 * Get status badge class
 * @param {string} status - Manga status
 * @returns {string} CSS class name
 */
export function getStatusClass(status) {
  const map = {
    ongoing: 'manga-card__status--ongoing',
    completed: 'manga-card__status--completed',
    hiatus: 'manga-card__status--hiatus',
    cancelled: 'manga-card__status--cancelled',
  };
  return map[status] || '';
}

/**
 * Get demographic badge class
 * @param {string} demo - Publication demographic
 * @returns {string} CSS class name
 */
export function getDemographicClass(demo) {
  const map = {
    shounen: 'manga-detail__badge--demo-shounen',
    shoujo: 'manga-detail__badge--demo-shoujo',
    josei: 'manga-detail__badge--demo-josei',
    seinen: 'manga-detail__badge--demo-seinen',
  };
  return map[demo] || '';
}

/**
 * Get page URL for MangaDex@Home
 * @param {Object} chapter - Chapter object
 * @param {string} baseUrl - AtHome server base URL
 * @param {number} page - Page number
 * @returns {string} Image URL
 */
export function getChapterPageUrl(chapter, baseUrl, page) {
  const hash = chapter.attributes?.data?.hash;
  const pages = chapter.attributes?.data || [];
  const pageData = pages[page];

  if (!hash || !pageData) return '';

  // Use the correct filename from at-home response
  return `${baseUrl}/data/${hash}/${pageData}`;
}

/**
 * Parse markdown-like description text
 * @param {string} text - Description text
 * @returns {string} Sanitized HTML
 */
export function parseDescription(text) {
  if (!text) return '';
  return text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// Export the rate limiter for external use
export { rateLimiter, apiRequest };