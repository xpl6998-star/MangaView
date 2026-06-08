/**
 * LocalStorage Store for Library Management
 */

const STORAGE_KEY = 'mangaview_library';
const READING_PROGRESS_KEY = 'mangaview_progress';

// Reading status values
export const READING_STATUS = {
  READING: 'reading',
  ON_HOLD: 'on_hold',
  PLAN_TO_READ: 'plan_to_read',
  DROPPED: 'dropped',
  RE_READING: 're_reading',
  COMPLETED: 'completed',
};

// Status display names
export const STATUS_DISPLAY = {
  [READING_STATUS.READING]: 'Reading',
  [READING_STATUS.ON_HOLD]: 'On Hold',
  [READING_STATUS.PLAN_TO_READ]: 'Plan to Read',
  [READING_STATUS.DROPPED]: 'Dropped',
  [READING_STATUS.RE_READING]: 'Re-reading',
  [READING_STATUS.COMPLETED]: 'Completed',
};

/**
 * Get library data from storage
 * @returns {Object} Library data
 */
function getLibraryData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { entries: {} };
  } catch {
    return { entries: {} };
  }
}

/**
 * Save library data to storage
 * @param {Object} data - Library data
 */
function saveLibraryData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save library data:', error);
  }
}

/**
 * Get reading progress from storage
 * @returns {Object} Reading progress data
 */
function getReadingProgress() {
  try {
    const data = localStorage.getItem(READING_PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Save reading progress to storage
 * @param {Object} data - Reading progress data
 */
function saveReadingProgress(data) {
  try {
    localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save reading progress:', error);
  }
}

/**
 * Add or update a manga in the library
 * @param {string} mangaId - Manga ID
 * @param {string} status - Reading status
 * @param {Object} mangaData - Manga data for quick display
 */
export function addToLibrary(mangaId, status, mangaData = {}) {
  const data = getLibraryData();
  data.entries[mangaId] = {
    status,
    addedAt: data.entries[mangaId]?.addedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    manga: mangaData,
  };
  saveLibraryData(data);
  return data.entries[mangaId];
}

/**
 * Remove a manga from the library
 * @param {string} mangaId - Manga ID
 */
export function removeFromLibrary(mangaId) {
  const data = getLibraryData();
  delete data.entries[mangaId];
  saveLibraryData(data);
}

/**
 * Get library entry for a manga
 * @param {string} mangaId - Manga ID
 * @returns {Object|null} Library entry
 */
export function getLibraryEntry(mangaId) {
  const data = getLibraryData();
  return data.entries[mangaId] || null;
}

/**
 * Update reading status for a manga
 * @param {string} mangaId - Manga ID
 * @param {string} status - New reading status
 */
export function updateStatus(mangaId, status) {
  const data = getLibraryData();
  if (data.entries[mangaId]) {
    data.entries[mangaId].status = status;
    data.entries[mangaId].updatedAt = new Date().toISOString();
    saveLibraryData(data);
  }
}

/**
 * Get all library entries
 * @param {string|null} status - Filter by status (optional)
 * @returns {Array} Array of library entries
 */
export function getAllEntries(status = null) {
  const data = getLibraryData();
  let entries = Object.entries(data.entries).map(([id, entry]) => ({
    mangaId: id,
    ...entry,
  }));

  if (status) {
    entries = entries.filter(e => e.status === status);
  }

  // Sort by updatedAt descending
  entries.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return entries;
}

/**
 * Get count by status
 * @returns {Object} Counts by status
 */
export function getStatusCounts() {
  const data = getLibraryData();
  const counts = {};

  Object.values(READING_STATUS).forEach(status => {
    counts[status] = 0;
  });

  Object.values(data.entries).forEach(entry => {
    if (counts[entry.status] !== undefined) {
      counts[entry.status]++;
    }
  });

  return counts;
}

/**
 * Check if manga is in library
 * @param {string} mangaId - Manga ID
 * @returns {boolean}
 */
export function isInLibrary(mangaId) {
  return !!getLibraryData().entries[mangaId];
}

/**
 * Save reading progress for a chapter
 * @param {string} chapterId - Chapter ID
 * @param {number} page - Current page
 * @param {number} totalPages - Total pages
 */
export function saveChapterProgress(chapterId, page, totalPages) {
  const progress = getReadingProgress();
  progress[chapterId] = {
    page,
    totalPages,
    updatedAt: new Date().toISOString(),
  };
  saveReadingProgress(progress);
}

/**
 * Get reading progress for a chapter
 * @param {string} chapterId - Chapter ID
 * @returns {Object|null} Progress data
 */
export function getChapterProgress(chapterId) {
  const progress = getReadingProgress();
  return progress[chapterId] || null;
}

/**
 * Mark chapter as read and move to next
 * @param {string} chapterId - Chapter ID
 * @param {number} currentPage - Current page
 * @param {number} totalPages - Total pages
 */
export function markChapterRead(chapterId, currentPage, totalPages) {
  if (currentPage >= totalPages - 1) {
    const progress = getReadingProgress();
    progress[chapterId] = {
      page: totalPages,
      totalPages,
      completed: true,
      updatedAt: new Date().toISOString(),
    };
    saveReadingProgress(progress);
  }
}

/**
 * Clear all library data (for testing)
 */
export function clearLibrary() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(READING_PROGRESS_KEY);
}

export default {
  addToLibrary,
  removeFromLibrary,
  getLibraryEntry,
  updateStatus,
  getAllEntries,
  getStatusCounts,
  isInLibrary,
  saveChapterProgress,
  getChapterProgress,
  markChapterRead,
  READING_STATUS,
  STATUS_DISPLAY,
};