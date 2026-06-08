/**
 * Jikan API Client (MyAnimeList)
 * Uses fast CDN for images
 */

const API_BASE = 'https://api.jikan.moe/v4';
const IMAGE_CDN = 'https://cdn.myanimelist.net';

// Rate limiter: 3 requests per second (Jikan limit)
class RateLimiter {
  constructor(maxRequests = 3, windowMs = 1000) {
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

async function apiRequest(endpoint) {
  const url = `${API_BASE}${endpoint}`;

  return rateLimiter.add(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`API Error ${res.status}`);
      return res.json();
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  });
}

// ============ API Endpoints ============

export const anime = {
  async list(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.order) query.set('order', params.order);
    if (params.type) query.set('type', params.type);
    if (params.status) query.set('status', params.status);
    if (params.genre) query.set('genres', params.genre);
    if (params.q) query.set('q', params.q);

    const queryStr = query.toString();
    return apiRequest(`/top/anime${queryStr ? '?' + queryStr : ''}`);
  },

  async get(id) {
    return apiRequest(`/anime/${id}`);
  },

  async search(query) {
    return apiRequest(`/anime?q=${encodeURIComponent(query)}&limit=10`);
  },

  async characters(id) {
    return apiRequest(`/anime/${id}/characters`);
  },
};

export const manga = {
  async list(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.order) query.set('order', params.order);
    if (params.type) query.set('type', params.type);
    if (params.status) query.set('status', params.status);
    if (params.genre) query.set('genres', params.genre);
    if (params.q) query.set('q', params.q);

    const queryStr = query.toString();
    return apiRequest(`/top/manga${queryStr ? '?' + queryStr : ''}`);
  },

  async get(id) {
    return apiRequest(`/manga/${id}`);
  },

  async search(query) {
    return apiRequest(`/manga?q=${encodeURIComponent(query)}&limit=10`);
  },

  async characters(id) {
    return apiRequest(`/manga/${id}/characters`);
  },
};

export const genre = {
  async list() {
    return apiRequest('/genres/anime');
  },
};

// ============ Utility Functions ============

export function getImageUrl(images, size = 'image_url') {
  if (!images) return '';
  // Support both jikan and standard format
  const url = images.jpg?.[size] || images[size] || images.image_url || '';
  return url;
}

export function getPosterUrl(images) {
  return getImageUrl(images, 'small_image_url');
}

export function getThumbnailUrl(images) {
  return getImageUrl(images, 'small_image_url');
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export function getKindClass(type) {
  const map = {
    'TV': 'kind--tv',
    'Movie': 'kind--movie',
    'OVA': 'kind--ova',
    'ONA': 'kind--ona',
    'Special': 'kind--special',
    'Manga': 'kind--manga',
    'Novel': 'kind--novel',
    'One-shot': 'kind--oneshot',
  };
  return map[type] || '';
}

export function getStatusClass(status) {
  const map = {
    'Currently Airing': 'status--ongoing',
    'Finished Airing': 'status--released',
    'Upcoming': 'status--anons',
    'Paused': 'status--paused',
    'Discontinued': 'status--discontinued',
  };
  return map[status] || '';
}

export function getScoreClass(score) {
  if (!score) return 'score--none';
  if (score >= 8.5) return 'score--excellent';
  if (score >= 7.5) return 'score--great';
  if (score >= 6.5) return 'score--good';
  if (score >= 5.5) return 'score--fair';
  return 'score--bad';
}

export { rateLimiter };
export default { anime, manga, genre, getImageUrl, getPosterUrl, getThumbnailUrl, formatDate, getKindClass, getStatusClass, getScoreClass };