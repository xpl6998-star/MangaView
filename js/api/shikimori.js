/**
 * Shikimori API Client
 * Anime & Manga database with no CORS issues
 */

const API_BASE = 'https://shikimori.one/api';
const IMAGE_BASE = 'https://shikimori.one';

// Rate limiter: 10 requests per second
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 1000) {
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

    setTimeout(() => this.process(), this.windowMs / this.maxRequests);
  }
}

const rateLimiter = new RateLimiter();

async function apiRequest(endpoint, options = {}) {
  const { params } = options;
  const url = new URL(`${API_BASE}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    });
  }

  const response = await rateLimiter.add(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  });

  if (!response.ok) {
    throw new Error(`API Error ${response.status}`);
  }

  return response.json();
}

// ============ API Endpoints ============

export const anime = {
  /**
   * Get anime list with optional filters
   */
  async list(params = {}) {
    return apiRequest('/animes', { params: {
      page: params.page || 1,
      limit: params.limit || 20,
      order: params.order || 'ranked',
      kind: params.kind,
      status: params.status,
      genre: params.genre,
      studio: params.studio,
      year: params.year,
      season: params.season,
      score: params.score,
      ...params,
    }});
  },

  /**
   * Get anime details by ID
   */
  async get(id) {
    return apiRequest(`/animes/${id}`);
  },

  /**
   * Search anime by query
   */
  async search(query) {
    return apiRequest('/animes/search', { params: { name: query } });
  },

  /**
   * Get characters for anime
   */
  async characters(id) {
    return apiRequest(`/animes/${id}/characters`);
  },

  /**
   * Get similar anime
   */
  async similar(id) {
    return apiRequest(`/animes/${id}/similar`);
  },
};

export const manga = {
  /**
   * Get manga list with optional filters
   */
  async list(params = {}) {
    return apiRequest('/mangas', { params: {
      page: params.page || 1,
      limit: params.limit || 20,
      order: params.order || 'ranked',
      kind: params.kind,
      status: params.status,
      genre: params.genre,
      year: params.year,
      score: params.score,
      ...params,
    }});
  },

  /**
   * Get manga details by ID
   */
  async get(id) {
    return apiRequest(`/mangas/${id}`);
  },

  /**
   * Search manga by query
   */
  async search(query) {
    return apiRequest('/mangas/search', { params: { name: query } });
  },

  /**
   * Get characters for manga
   */
  async characters(id) {
    return apiRequest(`/mangas/${id}/characters`);
  },

  /**
   * Get similar manga
   */
  async similar(id) {
    return apiRequest(`/mangas/${id}/similar`);
  },
};

export const genre = {
  /**
   * Get all genres
   */
  async list() {
    return apiRequest('/genres');
  },
};

export const studio = {
  /**
   * Get all studios
   */
  async list() {
    return apiRequest('/studios');
  },
};

// ============ Utility Functions ============

/**
 * Get image URL with size
 * @param {Object} image - Image object from API {original, preview, x96, x48}
 * @param {'original' | 'preview' | 'x96' | 'x48'} size - Image size
 * @returns {string} Full image URL
 */
export function getImageUrl(image, size = 'x96') {
  if (!image) return '';
  // Prefer x48 for faster loading (CDN is slow)
  const path = image[size] || image.x48 || image.preview || image.original || '';
  if (!path) return '';

  // If it's already a full URL, return it
  if (path.startsWith('http')) return path;

  // Otherwise, prepend the base URL
  return `${IMAGE_BASE}${path}`;
}

/**
 * Get cover URL (alias for getImageUrl with x96 size)
 */
export function getCoverUrl(image) {
  return getImageUrl(image, 'x96');
}

/**
 * Get poster URL (alias for getImageUrl with preview size)
 */
export function getPosterUrl(image) {
  return getImageUrl(image, 'preview');
}

/**
 * Get thumbnail URL
 */
export function getThumbnailUrl(image) {
  return getImageUrl(image, 'x48');
}

/**
 * Format date
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Format relative date
 */
export function formatRelativeDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 365) return `${Math.floor(days / 365)}y ago`;
  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * Get kind/demographic badge class
 */
export function getKindClass(kind) {
  const map = {
    'tv': 'kind--tv',
    'movie': 'kind--movie',
    'ova': 'kind--ova',
    'ona': 'kind--ona',
    'special': 'kind--special',
    'manga': 'kind--manga',
    'manhwa': 'kind--manhwa',
    'light_novel': 'kind--novel',
    'novel': 'kind--novel',
    'one_shot': 'kind--oneshot',
  };
  return map[kind] || '';
}

/**
 * Get status badge class
 */
export function getStatusClass(status) {
  const map = {
    'ongoing': 'status--ongoing',
    'anons': 'status--anons',
    'released': 'status--released',
    'paused': 'status--paused',
    'discontinued': 'status--discontinued',
  };
  return map[status] || '';
}

/**
 * Get score color class
 */
export function getScoreClass(score) {
  if (!score || score === '0.0') return 'score--none';
  const num = parseFloat(score);
  if (num >= 8.5) return 'score--excellent';
  if (num >= 7.5) return 'score--great';
  if (num >= 6.5) return 'score--good';
  if (num >= 5.5) return 'score--fair';
  return 'score--bad';
}

export { rateLimiter, apiRequest };
export default { anime, manga, genre, studio, getImageUrl, getCoverUrl, getPosterUrl, getThumbnailUrl, formatDate, formatRelativeDate, getKindClass, getStatusClass, getScoreClass };