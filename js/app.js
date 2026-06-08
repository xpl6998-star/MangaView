/**
 * MangaView - Main Application
 */

import { manga, chapter, author, group, cover as coverApi, getCoverUrl, getLocalizedText, getRelationship, formatRelativeDate, getContentRatingClass, getStatusClass, getDemographicClass, parseDescription } from './api/client.js';
import { addToLibrary, removeFromLibrary, getLibraryEntry, updateStatus, getAllEntries, getStatusCounts, isInLibrary, saveChapterProgress, getChapterProgress, READING_STATUS, STATUS_DISPLAY } from './store.js';
import router from './router.js';

// ============ State ============
let allTags = [];
let cachedTags = false;

// ============ Initialize App ============
function init() {
  renderHeader();
  loadTags();
}

// ============ Header ============
function renderHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  header.innerHTML = `
    <div class="header__inner">
      <a href="#/" class="header__logo">
        <span class="header__logo-icon">🌸</span>
        <span>MangaView</span>
      </a>
      <nav class="header__nav">
        <a href="#/" class="header__nav-link" data-route="/">Home</a>
        <a href="#/search" class="header__nav-link" data-route="/search">Search</a>
        <a href="#/library" class="header__nav-link" data-route="/library">Library</a>
      </nav>
      <div class="header__search">
        <svg class="header__search-btn" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input type="text" class="header__search-input" placeholder="Search manga..." id="header-search-input">
      </div>
    </div>
  `;

  // Search input handler
  const searchInput = header.querySelector('#header-search-input');
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query) {
        router.navigate(`/search?q=${encodeURIComponent(query)}`);
      }
    }
  });
}

// ============ Tags Loading ============
async function loadTags() {
  if (cachedTags) return;

  try {
    const response = await manga.getTags();
    allTags = response.data || [];
    cachedTags = true;
  } catch (error) {
    console.error('Failed to load tags:', error);
  }
}

// ============ Home Page ============
async function renderHome() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="page page-enter">
      <section class="hero">
        <div class="hero__background"></div>
        <div class="hero__particles">
          ${Array(8).fill(0).map(() => '<div class="hero__particle"></div>').join('')}
        </div>
        <div class="hero__content container">
          <div class="hero__text">
            <span class="hero__subtitle">Welcome to MangaView</span>
            <h1 class="hero__title">Discover Your Next Favorite Manga</h1>
            <p class="hero__description">Browse thousands of manga titles from MangaDex. Track your reading progress and find new series to explore.</p>
            <a href="#/search" class="hero__cta">
              <span>Explore Manga</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">Latest Updates</h2>
            <a href="#/search?sort=latestUploadedChapter" class="section__link">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
          <div class="manga-grid manga-grid--horizontal" id="latest-updates">
            ${Array(6).fill(0).map(() => `
              <div class="manga-card skeleton--card"></div>
            `).join('')}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">Popular Manga</h2>
            <a href="#/search?sort=followedCount" class="section__link">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
          <div class="manga-grid" id="popular-manga">
            ${Array(8).fill(0).map(() => `
              <div class="manga-card skeleton--card"></div>
            `).join('')}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">Browse by Genre</h2>
          </div>
          <div class="tags-cloud" id="tags-cloud">
            ${Array(12).fill(0).map(() => `
              <span class="filter-tag skeleton" style="width: 80px; height: 32px;"></span>
            `).join('')}
          </div>
        </div>
      </section>
    </div>
  `;

  // Load latest updates
  loadLatestUpdates();

  // Load popular manga
  loadPopularManga();

  // Load tags cloud
  loadTagsCloud();
}

async function loadLatestUpdates() {
  const container = document.getElementById('latest-updates');
  if (!container) return;

  try {
    const response = await manga.list({
      'order[latestUploadedChapter]': 'desc',
      limit: 12,
      includes: ['cover_art', 'author'],
    });

    const mangaList = response.data || [];
    container.innerHTML = mangaList.length > 0
      ? mangaList.map(m => renderMangaCard(m)).join('')
      : '<p class="manga-grid--horizontal" style="padding: 20px; color: var(--text-muted);">No manga found</p>';

    attachCardListeners(container);
  } catch (error) {
    console.error('Failed to load latest updates:', error);
    container.innerHTML = '<p style="padding: 20px; color: var(--text-muted);">Failed to load updates</p>';
  }
}

async function loadPopularManga() {
  const container = document.getElementById('popular-manga');
  if (!container) return;

  try {
    const response = await manga.list({
      'order[followedCount]': 'desc',
      limit: 8,
      includes: ['cover_art'],
    });

    const mangaList = response.data || [];
    container.innerHTML = mangaList.length > 0
      ? mangaList.map(m => renderMangaCard(m)).join('')
      : '<p style="padding: 20px; color: var(--text-muted);">No manga found</p>';

    attachCardListeners(container);
  } catch (error) {
    console.error('Failed to load popular manga:', error);
    container.innerHTML = '<p style="padding: 20px; color: var(--text-muted);">Failed to load</p>';
  }
}

function loadTagsCloud() {
  const container = document.getElementById('tags-cloud');
  if (!container || allTags.length === 0) return;

  const displayTags = allTags.slice(0, 24);
  container.innerHTML = displayTags.map(tag => {
    const name = getLocalizedText(tag.attributes, 'name');
    return `
      <a href="#/search?tags=${tag.id}" class="filter-tag">${name}</a>
    `;
  }).join('');
}

// ============ Manga Card ============
function renderMangaCard(mangaData) {
  const attrs = mangaData.attributes;
  const title = getLocalizedText(attrs, 'title') || 'Unknown Title';
  const status = attrs.status || '';
  const rating = attrs.contentRating || 'safe';

  // Get cover relationship
  const coverRel = getRelationship(mangaData.relationships, 'cover_art');
  const coverUrl = coverRel ? getCoverUrl(coverRel, '256') : '';

  // Get first few tags
  const tags = (attrs.tags || []).slice(0, 3).map(t => {
    return getLocalizedText(t.attributes, 'name');
  }).filter(Boolean);

  return `
    <article class="manga-card" data-manga-id="${mangaData.id}">
      <div class="manga-card__cover">
        <img src="${coverUrl}" alt="${title}" loading="lazy"
             onerror="this.style.display='none'"
             class="manga-card__cover-img">
        <div class="manga-card__cover-overlay"></div>
        ${status ? `<span class="manga-card__status ${getStatusClass(status)}">${status}</span>` : ''}
        <span class="manga-card__rating ${getContentRatingClass(rating)}">${rating}</span>
      </div>
      <div class="manga-card__info">
        <h3 class="manga-card__title">${title}</h3>
        <div class="manga-card__meta">
          ${tags.map(tag => `<span class="manga-card__tag">${tag}</span>`).join('')}
        </div>
      </div>
    </article>
  `;
}

function attachCardListeners(container) {
  container.querySelectorAll('.manga-card[data-manga-id]').forEach(card => {
    card.addEventListener('click', () => {
      const mangaId = card.dataset.mangaId;
      router.navigate(`/manga/${mangaId}`);
    });
  });
}

// ============ Search Page ============
async function renderSearch() {
  const app = document.getElementById('app');
  if (!app) return;

  // Parse query params from hash
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const query = params.get('q') || '';
  const tagParam = params.get('tags') || '';
  const statusParam = params.get('status') || '';
  const demoParam = params.get('demo') || '';
  const sortParam = params.get('sort') || 'latestUploadedChapter';
  const offsetParam = parseInt(params.get('offset') || '0');

  app.innerHTML = `
    <div class="page page-enter">
      <div class="container search-page">
        <div class="search-header">
          <h1 class="search-title">Search Manga</h1>
          <div class="search-bar">
            <div class="search-input-wrapper">
              <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input type="text" class="search-input" id="search-input" placeholder="Search by title, author..." value="${query}">
            </div>
           <button class="btn btn--primary" id="search-btn">Search</button>
          </div>
        </div>

        <div class="filters">
          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select class="filter-select" id="filter-status">
              <option value="">All</option>
              <option value="ongoing" ${statusParam === 'ongoing' ? 'selected' : ''}>Ongoing</option>
              <option value="completed" ${statusParam === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="hiatus" ${statusParam === 'hiatus' ? 'selected' : ''}>Hiatus</option>
              <option value="cancelled" ${statusParam === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Demographic</label>
            <select class="filter-select" id="filter-demo">
              <option value="">All</option>
              <option value="shounen" ${demoParam === 'shounen' ? 'selected' : ''}>Shounen</option>
              <option value="shoujo" ${demoParam === 'shoujo' ? 'selected' : ''}>Shoujo</option>
              <option value="josei" ${demoParam === 'josei' ? 'selected' : ''}>Josei</option>
              <option value="seinen" ${demoParam === 'seinen' ? 'selected' : ''}>Seinen</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Sort By</label>
            <select class="filter-select" id="filter-sort">
              <option value="latestUploadedChapter" ${sortParam === 'latestUploadedChapter' ? 'selected' : ''}>Latest</option>
              <option value="title" ${sortParam === 'title' ? 'selected' : ''}>Title</option>
              <option value="followedCount" ${sortParam === 'followedCount' ? 'selected' : ''}>Popular</option>
              <option value="createdAt" ${sortParam === 'createdAt' ? 'selected' : ''}>Newest</option>
            </select>
          </div>
          <div class="filter-group" style="flex: 1;">
            <label class="filter-label">Genre</label>
            <div class="filter-tags" id="filter-tags-container">
              ${tagParam ? `<span class="filter-tag filter-tag--selected" data-tag-id="${tagParam}">${getTagName(tagParam)}</span>` : '<span style="color: var(--text-muted);">Click to add tags...</span>'}
            </div>
          </div>
        </div>

        <div class="manga-grid" id="search-results">
          ${Array(12).fill(0).map(() => `<div class="manga-card skeleton--card"></div>`).join('')}
        </div>

        <div class="pagination" id="search-pagination"></div>
      </div>
    </div>
  `;

  // Setup search handlers
  setupSearchHandlers(query, tagParam, statusParam, demoParam, sortParam, offsetParam);

  // Perform initial search
  performSearch(query, tagParam, statusParam, demoParam, sortParam, offsetParam);
}

function getTagName(tagId) {
  const tag = allTags.find(t => t.id === tagId);
  return tag ? getLocalizedText(tag.attributes, 'name') : tagId;
}

function setupSearchHandlers(query, tagParam, statusParam, demoParam, sortParam, offset) {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const filterStatus = document.getElementById('filter-status');
  const filterDemo = document.getElementById('filter-demo');
  const filterSort = document.getElementById('filter-sort');

  const updateURL = () => {
    const q = searchInput.value.trim();
    const status = filterStatus.value;
    const demo = filterDemo.value;
    const sort = filterSort.value;
    const tags = tagParam;

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (demo) params.set('demo', demo);
    if (sort !== 'latestUploadedChapter') params.set('sort', sort);
    if (tags) params.set('tags', tags);

    router.navigate(`/search${params.toString() ? '?' + params.toString() : ''}`);
  };

  searchBtn.addEventListener('click', updateURL);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') updateURL();
  });

  [filterStatus, filterDemo, filterSort].forEach(el => {
    el.addEventListener('change', updateURL);
  });
}

async function performSearch(query, tagParam, statusParam, demoParam, sortParam, offset) {
  const container = document.getElementById('search-results');
  const pagination = document.getElementById('search-pagination');
  if (!container) return;

  try {
    const response = await manga.list({
      title: query || undefined,
      status: statusParam || undefined,
      'publicationDemographic[]': demoParam || undefined,
      'tags[]': tagParam || undefined,
      'order[latestUploadedChapter]': sortParam === 'latestUploadedChapter' ? 'desc' : undefined,
      'order[title]': sortParam === 'title' ? 'asc' : undefined,
      'order[followedCount]': sortParam === 'followedCount' ? 'desc' : undefined,
      'order[createdAt]': sortParam === 'createdAt' ? 'desc' : undefined,
      offset: offset,
      limit: 24,
    });

    const mangaList = response.data || [];
    const total = response.total || 0;

    container.innerHTML = mangaList.length > 0
      ? mangaList.map(m => renderMangaCard(m)).join('')
      : '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No manga found. Try different search terms.</p>';

    attachCardListeners(container);

    // Render pagination
    renderPagination(offset, total, 24);

  } catch (error) {
    console.error('Search failed:', error);
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Failed to load results</p>';
  }
}

function renderPagination(offset, total, limit) {
  const pagination = document.getElementById('search-pagination');
  if (!pagination) return;

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const maxPages = 10;
  const startPage = Math.max(1, currentPage - 5);
  const endPage = Math.min(totalPages, startPage + maxPages - 1);

  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  let html = '';

  html += `<button class="pagination__btn" ${!hasPrev ? 'disabled' : ''} onclick="window.app.goToPage(${offset - limit})">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 18l-6-6 6-6"></path>
    </svg>
  </button>`;

  for (let i = startPage; i <= endPage; i++) {
    const pageOffset = (i - 1) * limit;
    html += `<button class="pagination__btn ${i === currentPage ? 'pagination__btn--active' : ''}" onclick="window.app.goToPage(${pageOffset})">${i}</button>`;
  }

  html += `<button class="pagination__btn" ${!hasNext ? 'disabled' : ''} onclick="window.app.goToPage(${offset + limit})">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 18l6-6-6-6"></path>
    </svg>
  </button>`;

  pagination.innerHTML = html;
}

// ============ Manga Detail Page ============
async function renderMangaDetail(mangaId) {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="page page-enter">
      <div class="container manga-detail">
        <div class="manga-detail__header" id="manga-detail-header">
          <div class="manga-detail__cover skeleton--card"></div>
          <div class="manga-detail__info">
            <div class="skeleton skeleton--text" style="width: 80px;"></div>
            <div class="skeleton skeleton--text" style="height: 2em;"></div>
            <div class="skeleton skeleton--text" style="width: 60%;"></div>
           <div class="skeleton skeleton--text"></div>
            <div class="skeleton skeleton--text"></div>
          </div>
        </div>

        <section class="section">
          <div class="chapter-list" id="chapter-list">
            <div class="chapter-list__header">
              <h3 class="chapter-list__title">Chapters</h3>
            </div>
            <div id="chapter-list-content">
              ${Array(8).fill(0).map(() => `
                <div class="chapter-item">
                  <div class="skeleton" style="width: 80px; height: 20px;"></div>
                  <div class="skeleton" style="flex: 1; height: 20px; margin: 0 16px;"></div>
                  <div class="skeleton" style="width: 150px; height: 20px;"></div>
                </div>
              `).join('')}
            </div>
          </div>
         <div class="pagination" id="chapter-pagination"></div>
        </section>
      </div>
    </div>
  `;

  try {
    // Load manga details
    const [mangaRes, feedRes] = await Promise.all([
      manga.get(mangaId),
      manga.getFeed(mangaId, { limit: 100 }),
    ]);

    const mangaData = mangaRes.data;
    const chaptersData = feedRes.data || [];
    const totalChapters = feedRes.total || 0;

    if (!mangaData) {
      app.innerHTML = '<div class="page"><div class="container" style="text-align: center; padding: 80px 0;"><h1>Manga not found</h1></div></div>';
      return;
    }

    renderMangaDetailContent(mangaData, chaptersData, totalChapters);

  } catch (error) {
    console.error('Failed to load manga details:', error);
    app.innerHTML = '<div class="page"><div class="container" style="text-align: center; padding: 80px 0;"><h1>Failed to load manga</h1></div></div>';
  }
}

function renderMangaDetailContent(mangaData, chaptersData, totalChapters) {
  const attrs = mangaData.attributes;
  const title = getLocalizedText(attrs, 'title') || 'Unknown Title';
  const description = parseDescription(getLocalizedText(attrs, 'description'));
  const altTitles = (attrs.altTitles || []).map(a => Object.values(a)[0]).filter(Boolean);
  const status = attrs.status || '';
  const demo = attrs.publicationDemographic || '';
  const rating = attrs.contentRating || 'safe';
  const tags = attrs.tags || [];

  // Get relationships
  const coverRel = getRelationship(mangaData.relationships, 'cover_art');
  const authorRels = mangaData.relationships.filter(r => r.type === 'author');
  const artistRels = mangaData.relationships.filter(r => r.type === 'artist');

  const coverUrl = coverRel ? getCoverUrl(coverRel, '512') : '';

  // Render header
  const header = document.getElementById('manga-detail-header');
  header.innerHTML = `
    <div class="manga-detail__cover">
      <img src="${coverUrl}" alt="${title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 3 4%22%3E%3Crect fill=%22%2325253A%22 width=%223%22 height=%224%22/%3E%3C/svg%3E'">
    </div>
    <div class="manga-detail__info">
      <div class="manga-detail__badges">
        ${status ? `<span class="manga-detail__badge manga-detail__badge--status">${status}</span>` : ''}
        ${demo ? `<span class="manga-detail__badge ${getDemographicClass(demo)}">${demo}</span>` : ''}
        <span class="manga-detail__badge" style="color: var(--status-${rating}); border-color: var(--status-${rating});">${rating}</span>
      </div>
      <h1 class="manga-detail__title">${title}</h1>
      ${altTitles.length > 0 ? `<p class="manga-detail__alt-titles">${altTitles.slice(0, 3).join(' / ')}</p>` : ''}
      <div class="manga-detail__tags">
        ${tags.map(tag => {
          const name = getLocalizedText(tag.attributes, 'name');
          return `<a href="#/search?tags=${tag.id}" class="manga-detail__tag">${name}</a>`;
        }).join('')}
      </div>
      <p class="manga-detail__description" id="manga-description">${description}</p>
      <button class="manga-detail__expand-btn" id="desc-expand-btn">Show more</button>
      <div class="manga-detail__stats">
        <div class="manga-detail__stat">
          <div class="manga-detail__stat-value">${totalChapters}</div>
          <div class="manga-detail__stat-label">Chapters</div>
        </div>
      </div>
      <div class="manga-detail__actions">
        <button class="btn btn--primary" id="start-reading-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Start Reading
        </button>
        <button class="btn btn--secondary" id="add-library-btn">
          ${isInLibrary(mangaData.id) ? 'In Library' : 'Add to Library'}
        </button>
      </div>
    </div>
  `;

  // Description expand toggle
  const descEl = document.getElementById('manga-description');
  const descBtn = document.getElementById('desc-expand-btn');
  descBtn?.addEventListener('click', () => {
    descEl.classList.toggle('expanded');
    descBtn.textContent = descEl.classList.contains('expanded') ? 'Show less' : 'Show more';
  });

  // Add to library button
  const libraryBtn = document.getElementById('add-library-btn');
  libraryBtn?.addEventListener('click', () => {
    if (isInLibrary(mangaData.id)) {
      removeFromLibrary(mangaData.id);
      libraryBtn.textContent = 'Add to Library';
    } else {
      addToLibrary(mangaData.id, READING_STATUS.READING, {
        title: getLocalizedText(attrs, 'title'),
        coverUrl,
        status,
      });
      libraryBtn.textContent = 'In Library';
    }
  });

  // Start reading button
  const startBtn = document.getElementById('start-reading-btn');
  startBtn?.addEventListener('click', () => {
    if (chaptersData.length > 0) {
      router.navigate(`/chapter/${chaptersData[0].id}/read`);
    }
  });

  // Render chapter list
  renderChapterList(chaptersData, totalChapters);
}

function renderChapterList(chaptersData, totalChapters) {
  const container = document.getElementById('chapter-list-content');
  const pagination = document.getElementById('chapter-pagination');
  if (!container) return;

  if (chaptersData.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-muted);">No chapters available</p>';
    return;
  }

  container.innerHTML = chaptersData.map(ch => {
    const attrs = ch.attributes;
    const chapterNum = attrs.chapter || '?';
    const chapterTitle = attrs.title || '';
    const groupRel = getRelationship(ch.relationships, 'scanlation_group');
    const groupName = groupRel ? groupRel.attributes?.name : 'Unknown';
    const date = formatRelativeDate(attrs.publishAt || attrs.createdAt);

    return `
      <div class="chapter-item" data-chapter-id="${ch.id}">
        <span class="chapter-item__number">Ch. ${chapterNum}</span>
        <span class="chapter-item__title">${chapterTitle}</span>
        <span class="chapter-item__group">${groupName}</span>
        <span class="chapter-item__date">${date}</span>
      </div>
    `;
  }).join('');

  // Chapter click handlers
  container.querySelectorAll('.chapter-item[data-chapter-id]').forEach(item => {
    item.addEventListener('click', () => {
      const chapterId = item.dataset.chapterId;
      router.navigate(`/chapter/${chapterId}/read`);
    });
  });
}

// ============ Chapter Reader ============
async function renderChapterReader(chapterId) {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="reader" id="chapter-reader">
      <div class="reader__header">
        <button class="reader__back" id="reader-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
          <span>Back</span>
        </button>
        <span class="reader__title" id="reader-title">Loading...</span>
        <span></span>
      </div>
      <div class="reader__pages" id="reader-pages">
        <div class="skeleton" style="width: 100%; max-width: 800px; height: 600px; margin: 20px auto;"></div>
      </div>
      <div class="reader__nav" id="reader-nav">
        <button class="reader__nav-btn" id="prev-page-btn" disabled>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
        </button>
        <span class="reader__nav-info" id="page-info">1 / 1</span>
        <button class="reader__nav-btn" id="next-page-btn" disabled>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"></path>
          </svg>
        </button>
      </div>
    </div>
  `;

  try {
    // Get chapter data
    const [chapterRes, atHomeRes] = await Promise.all([
      chapter.get(chapterId),
      chapter.getAtHomeServer(chapterId),
    ]);

    const chapterData = chapterRes.data;
    const atHomeData = atHomeRes;

    if (!chapterData) {
      showToast('Chapter not found', 'error');
      router.navigate('/');
      return;
    }

    window.currentChapter = {
      data: chapterData,
      atHome: atHomeData,
      currentPage: 0,
      totalPages: 0,
    };

    // Mark as read
    chapter.markRead(chapterId).catch(() => {});

    renderChapterPages();

  } catch (error) {
    console.error('Failed to load chapter:', error);
    showToast('Failed to load chapter', 'error');
    router.navigate('/');
  }
}

function renderChapterPages() {
  const ch = window.currentChapter;
  if (!ch) return;

  const attrs = ch.data.attributes;
  const pages = attrs.data || [];
  const baseUrl = ch.atHome.baseUrl || 'https://api.mangadex.org';

  ch.totalPages = pages.length;
  ch.currentPage = 0;

  const pagesContainer = document.getElementById('reader-pages');
  const titleEl = document.getElementById('reader-title');
  const navInfo = document.getElementById('page-info');

  // Get manga title from relationships
  const mangaRel = getRelationship(ch.data.relationships, 'manga');
  const mangaTitle = mangaRel ? getLocalizedText(mangaRel.attributes, 'title') : '';
  const chapterNum = attrs.chapter || '?';

  titleEl.textContent = `${mangaTitle} - Chapter ${chapterNum}`;

  // Save reading progress
  saveChapterProgress(ch.data.id, 0, pages.length);

  function updatePage() {
    pagesContainer.innerHTML = pages.map((pageFile, index) => {
      const pageUrl = `${baseUrl}/data/${ch.atHome.chapter.hash}/${pageFile}`;
      return `
        <div class="reader__page" data-page="${index}">
          <img src="${pageUrl}" alt="Page ${index + 1}" loading="${index < 2 ? 'eager' : 'lazy'}">
        </div>
      `;
    }).join('');

    navInfo.textContent = `${ch.currentPage + 1} / ${ch.totalPages}`;

    // Update nav buttons
    document.getElementById('prev-page-btn').disabled = ch.currentPage === 0;
    document.getElementById('next-page-btn').disabled = ch.currentPage >= ch.totalPages - 1;

    // Scroll to page
    const pageEl = pagesContainer.querySelector(`[data-page="${ch.currentPage}"]`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  updatePage();

  // Navigation handlers
  document.getElementById('prev-page-btn').onclick = () => {
    if (ch.currentPage > 0) {
      ch.currentPage--;
      updatePage();
      saveChapterProgress(ch.data.id, ch.currentPage, ch.totalPages);
    }
  };

  document.getElementById('next-page-btn').onclick = () => {
    if (ch.currentPage < ch.totalPages - 1) {
      ch.currentPage++;
      updatePage();
      saveChapterProgress(ch.data.id, ch.currentPage, ch.totalPages);
    }
  };

  // Back button
  document.getElementById('reader-back').onclick = () => {
    const mangaRel = getRelationship(ch.data.relationships, 'manga');
    if (mangaRel) {
      router.navigate(`/manga/${mangaRel.id}`);
    } else {
      router.navigate('/');
    }
  };

  // Keyboard navigation
  document.onkeydown = (e) => {
    if (e.key === 'ArrowLeft' && ch.currentPage > 0) {
      ch.currentPage--;
      updatePage();
    } else if (e.key === 'ArrowRight' && ch.currentPage < ch.totalPages - 1) {
      ch.currentPage++;
      updatePage();
    } else if (e.key === 'Escape') {
      document.getElementById('reader-back').click();
    }
  };
}

// ============ Library Page ============
function renderLibrary() {
  const app = document.getElementById('app');
  if (!app) return;

  const statusCounts = getStatusCounts();
  const entries = getAllEntries();
  const totalInLibrary = Object.keys(statusCounts).reduce((sum, key) => sum + statusCounts[key], 0);

  app.innerHTML = `
    <div class="page page-enter">
      <div class="container library">
        <div class="library__header">
          <h1 class="library__title">My Library</h1>
          <div class="library__tabs">
            <button class="library__tab library__tab--active" data-status="">All (${totalInLibrary})</button>
            ${Object.entries(STATUS_DISPLAY).map(([key, label]) => `
              <button class="library__tab" data-status="${key}">${label} (${statusCounts[key] || 0})</button>
            `).join('')}
          </div>
        </div>
        <div class="manga-grid" id="library-content">
          ${entries.length > 0 ? entries.map(e => renderLibraryCard(e)).join('') : `
            <div class="library__empty">
              <div class="library__empty-icon">📚</div>
              <p>Your library is empty</p>
              <p style="font-size: 0.9rem; margin-top: 8px;">Start adding manga to track your reading progress!</p>
             <a href="#/search" class="btn btn--primary" style="margin-top: 16px;">Browse Manga</a>
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  // Tab handlers
  document.querySelectorAll('.library__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.library__tab').forEach(t => t.classList.remove('library__tab--active'));
      tab.classList.add('library__tab--active');
      const status = tab.dataset.status;
      const filteredEntries = status ? getAllEntries(status) : getAllEntries();
      const container = document.getElementById('library-content');
      container.innerHTML = filteredEntries.length > 0
        ? filteredEntries.map(e => renderLibraryCard(e)).join('')
        : '<div class="library__empty"><p>No manga in this category</p></div>';
      attachLibraryCardListeners(container);
    });
  });

  attachLibraryCardListeners(document.getElementById('library-content'));
}

function renderLibraryCard(entry) {
  const mangaData = entry.manga || {};
  const title = mangaData.title || 'Unknown Title';
  const coverUrl = mangaData.coverUrl || '';
  const status = entry.status || '';

  return `
    <article class="manga-card" data-manga-id="${entry.mangaId}">
      <div class="manga-card__cover">
        <img src="${coverUrl}" alt="${title}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 3 4%22%3E%3Crect fill=%22%2325253A%22 width=%223%22 height=%224%22/%3E%3C/svg%3E'">
        <div class="manga-card__cover-overlay"></div>
        <span class="manga-card__status ${getStatusClass(status)}">${STATUS_DISPLAY[status] || status}</span>
      </div>
      <div class="manga-card__info">
        <h3 class="manga-card__title">${title}</h3>
      </div>
    </article>
  `;
}

function attachLibraryCardListeners(container) {
  container.querySelectorAll('.manga-card[data-manga-id]').forEach(card => {
    card.addEventListener('click', () => {
      router.navigate(`/manga/${card.dataset.mangaId}`);
    });
  });
}

// ============ Utility Functions ============
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// Expose to window for pagination
window.app = {
  goToPage: (offset) => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    params.set('offset', offset);
    router.navigate(`/search?${params.toString()}`);
  },
};

// ============ Initialize ============
document.addEventListener('DOMContentLoaded', init);

export { init, renderHome, renderSearch, renderMangaDetail, renderChapterReader, renderLibrary };