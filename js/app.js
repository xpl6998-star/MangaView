/**
 * MangaView - Main Application (Jikan/MyAnimeList API Version)
 */

import { anime, manga, genre, getImageUrl, getPosterUrl, formatDate, getKindClass, getStatusClass, getScoreClass } from './api/jikan.js';

// ============ Initialize App ============
function init() {
  renderHeader();
  loadGenres();
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
        <input type="text" class="header__search-input" placeholder="Search anime/manga..." id="header-search-input">
      </div>
    </div>
  `;

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

// ============ State ============
let allGenres = [];
let cachedGenres = false;

async function loadGenres() {
  if (cachedGenres) return;
  try {
    const data = await genre.list();
    allGenres = data.data || [];
    cachedGenres = true;
    updateGenresCloud();
  } catch (error) {
    console.error('Failed to load genres:', error);
  }
}

function updateGenresCloud() {
  const container = document.getElementById('genres-cloud');
  if (!container || allGenres.length === 0) return;

  container.innerHTML = allGenres.slice(0, 16).map(g => `
    <a href="#/search?genre=${g.mal_id}" class="filter-tag">${g.name}</a>
  `).join('');
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
            <h1 class="hero__title">Discover Your Next Favorite Anime</h1>
            <p class="hero__description">Browse thousands of anime and manga titles. Track your watching progress and find new series to explore.</p>
            <a href="#/search" class="hero__cta">
              <span>Explore Now</span>
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
            <h2 class="section__title">Top Rated Anime</h2>
            <a href="#/search?type=anime&order=score" class="section__link">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
          <div class="manga-grid" id="top-anime">
            ${Array(8).fill(0).map(() => `<div class="manga-card skeleton--card"></div>`).join('')}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">Top Manga</h2>
            <a href="#/search?type=manga&order=score" class="section__link">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
          <div class="manga-grid" id="top-manga">
            ${Array(8).fill(0).map(() => `<div class="manga-card skeleton--card"></div>`).join('')}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">Browse by Genre</h2>
          </div>
          <div class="tags-cloud" id="genres-cloud">
            ${Array(12).fill(0).map(() => `<span class="filter-tag skeleton" style="width: 80px; height: 32px;"></span>`).join('')}
          </div>
        </div>
      </section>
    </div>
  `;

  loadTopAnime();
  loadTopManga();
}

async function loadTopAnime() {
  const container = document.getElementById('top-anime');
  if (!container) return;

  try {
    const data = await anime.list({ limit: 8 });
    const list = data.data || [];
    container.innerHTML = list.length > 0
      ? list.map(item => renderAnimeCard(item, 'anime')).join('')
      : '<p style="padding: 20px; color: var(--text-muted);">No anime found</p>';
    attachCardListeners(container);
  } catch (error) {
    console.error('Failed to load top anime:', error);
    container.innerHTML = '<p style="padding: 20px; color: var(--text-muted);">Failed to load</p>';
  }
}

async function loadTopManga() {
  const container = document.getElementById('top-manga');
  if (!container) return;

  try {
    const data = await manga.list({ limit: 8 });
    const list = data.data || [];
    container.innerHTML = list.length > 0
      ? list.map(item => renderAnimeCard(item, 'manga')).join('')
      : '<p style="padding: 20px; color: var(--text-muted);">No manga found</p>';
    attachCardListeners(container);
  } catch (error) {
    console.error('Failed to load top manga:', error);
    container.innerHTML = '<p style="padding: 20px; color: var(--text-muted);">Failed to load</p>';
  }
}

// ============ Card Renderer ============
function renderAnimeCard(item, type = 'anime') {
  const title = item.title || item.title_english || 'Unknown';
  const score = item.score ? item.score.toFixed(2) : '';
  const imageUrl = getPosterUrl(item.images) || getImageUrl(item.images);
  const kind = item.type || '';
  const episodes = item.episodes || 0;
  const status = item.status || '';

  return `
    <article class="manga-card" data-id="${item.mal_id}" data-type="${type}">
      <div class="manga-card__cover">
        <img src="${imageUrl}" alt="${title}" loading="lazy"
             onerror="this.parentElement.style.background='linear-gradient(135deg, var(--color-primary-dark), var(--color-secondary))'"
             class="manga-card__cover-img">
        <div class="manga-card__cover-overlay"></div>
        ${kind ? `<span class="manga-card__status ${getKindClass(kind)}">${kind}</span>` : ''}
        ${score ? `<span class="manga-card__rating ${getScoreClass(score)}">★ ${score}</span>` : ''}
      </div>
      <div class="manga-card__info">
        <h3 class="manga-card__title">${title}</h3>
        <div class="manga-card__meta">
          ${status ? `<span class="manga-card__tag">${status.replace(' Airing', '')}</span>` : ''}
          ${episodes ? `<span class="manga-card__tag">${episodes} eps</span>` : ''}
          ${item.volumes ? `<span class="manga-card__tag">${item.volumes} vol</span>` : ''}
        </div>
      </div>
    </article>
  `;
}

function attachCardListeners(container) {
  container.querySelectorAll('.manga-card[data-id]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const type = card.dataset.type || 'anime';
      router.navigate(`/${type}/${id}`);
    });
  });
}

// ============ Search Page ============
async function renderSearch() {
  const app = document.getElementById('app');
  if (!app) return;

  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const query = params.get('q') || '';
  const type = params.get('type') || 'anime';
  const genreId = params.get('genre') || '';
  const page = parseInt(params.get('page') || '1');

  app.innerHTML = `
    <div class="page page-enter">
      <div class="container search-page">
        <div class="search-header">
          <h1 class="search-title">Search ${type === 'anime' ? 'Anime' : 'Manga'}</h1>
          <div class="search-bar">
            <div class="search-input-wrapper">
              <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input type="text" class="search-input" id="search-input" placeholder="Search by title..." value="${query}">
            </div>
            <button class="btn btn--primary" id="search-btn">Search</button>
          </div>
        </div>

        <div class="filters">
          <div class="filter-group">
            <label class="filter-label">Type</label>
            <select class="filter-select" id="filter-type">
              <option value="anime" ${type === 'anime' ? 'selected' : ''}>Anime</option>
              <option value="manga" ${type === 'manga' ? 'selected' : ''}>Manga</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Genre</label>
            <select class="filter-select" id="filter-genre">
              <option value="">All Genres</option>
              ${allGenres.map(g =>
                `<option value="${g.mal_id}" ${genreId === String(g.mal_id) ? 'selected' : ''}>${g.name}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="manga-grid" id="search-results">
          ${Array(12).fill(0).map(() => `<div class="manga-card skeleton--card"></div>`).join('')}
        </div>

        <div class="pagination" id="search-pagination"></div>
      </div>
    </div>
  `;

  setupSearchHandlers();
  performSearch(query, type, genreId, page);
}

function setupSearchHandlers() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const filterType = document.getElementById('filter-type');
  const filterGenre = document.getElementById('filter-genre');

  const updateURL = () => {
    const q = searchInput.value.trim();
    const t = filterType.value;
    const g = filterGenre.value;

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('type', t);
    if (g) params.set('genre', g);
    params.delete('page');

    router.navigate(`/search?${params.toString()}`);
  };

  searchBtn.addEventListener('click', updateURL);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') updateURL();
  });

  [filterType, filterGenre].forEach(el => {
    el.addEventListener('change', updateURL);
  });
}

async function performSearch(query, type, genreId, page) {
  const container = document.getElementById('search-results');
  const pagination = document.getElementById('search-pagination');
  if (!container) return;

  try {
    const limit = 24;
    const api = type === 'manga' ? manga : anime;
    const params = { page, limit };
    if (query) params.q = query;
    if (genreId) params.genre = genreId;

    const data = await api.list(params);
    const list = data.data || [];

    container.innerHTML = list.length > 0
      ? list.map(item => renderAnimeCard(item, type)).join('')
      : '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No results found.</p>';

    attachCardListeners(container);

    // Pagination
    if (data.pagination?.has_next_page) {
      pagination.innerHTML = `<button class="btn btn--secondary" onclick="window.app.goToPage(${page + 1})">Load More</button>`;
    }
  } catch (error) {
    console.error('Search failed:', error);
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Failed to load results</p>';
  }
}

// ============ Detail Page ============
async function renderMangaDetail(id) {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="page page-enter">
      <div class="container" style="padding-top: 40px;">
        <div class="manga-detail" id="manga-detail">
          <div class="manga-detail__loading">
            <div class="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const api = anime;
    const data = await api.get(id);
    renderDetail(data.data);
  } catch (error) {
    console.error('Failed to load details:', error);
    document.getElementById('manga-detail').innerHTML = `
      <div style="text-align: center; padding: 60px;">
        <h2>Failed to load details</h2>
        <p style="color: var(--text-muted);">Please try again later.</p>
        <a href="#/" class="btn btn--primary" style="margin-top: 20px;">Go Home</a>
      </div>
    `;
  }
}

function renderDetail(data) {
  const container = document.getElementById('manga-detail');
  if (!container) return;

  const title = data.title || data.title_english || 'Unknown';
  const imageUrl = getImageUrl(data.images);
  const score = data.score ? data.score.toFixed(2) : 'N/A';
  const status = data.status || '';
  const type = data.type || '';
  const episodes = data.episodes || 0;
  const synopsis = data.synopsis || '';
  const aired = data.aired?.string || '';

  container.innerHTML = `
    <div class="manga-detail__header">
      <div class="manga-detail__cover">
        <img src="${imageUrl}" alt="${title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 3 4%22%3E%3Crect fill=%22%2325253A%22 width=%223%22 height=%224%22/%3E%3C/svg%3E'">
      </div>
      <div class="manga-detail__info">
        <h1 class="manga-detail__title">${title}</h1>
        <div class="manga-detail__meta">
          ${score !== 'N/A' ? `<span class="manga-detail__score">★ ${score}</span>` : ''}
          ${type ? `<span class="manga-detail__kind">${type}</span>` : ''}
          ${status ? `<span class="manga-detail__status ${getStatusClass(status)}">${status}</span>` : ''}
        </div>
        <div class="manga-detail__stats">
          ${episodes ? `<div class="manga-detail__stat"><span class="label">Episodes:</span> ${episodes}</div>` : ''}
          ${data.volumes ? `<div class="manga-detail__stat"><span class="label">Volumes:</span> ${data.volumes}</div>` : ''}
          ${data.chapters ? `<div class="manga-detail__stat"><span class="label">Chapters:</span> ${data.chapters}</div>` : ''}
          ${aired ? `<div class="manga-detail__stat"><span class="label">Aired:</span> ${aired}</div>` : ''}
          ${data.duration ? `<div class="manga-detail__stat"><span class="label">Duration:</span> ${data.duration}</div>` : ''}
          ${data.rating ? `<div class="manga-detail__stat"><span class="label">Rating:</span> ${data.rating}</div>` : ''}
        </div>
        <div class="manga-detail__actions">
          <button class="btn btn--primary" id="add-to-library-btn">Add to Library</button>
        </div>
      </div>
    </div>
    ${synopsis ? `
    <div class="manga-detail__description">
      <h3>Synopsis</h3>
      <p>${synopsis.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}
  `;
}

// ============ Library Page ============
async function renderLibrary() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="page page-enter">
      <div class="container">
        <h1 class="search-title">My Library</h1>
        <div class="manga-grid" id="library-grid">
          <p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Loading library...</p>
        </div>
      </div>
    </div>
  `;
}

// ============ Chapter Reader ============
async function renderChapterReader(id) {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="page page-enter">
      <div class="container" style="text-align: center; padding: 60px 0;">
        <h2>Chapter Reader</h2>
        <p style="color: var(--text-muted); margin-top: 10px;">Jikan API does not provide chapter content. Please view anime details for more information.</p>
        <a href="#/" class="btn btn--primary" style="margin-top: 20px;">Go Home</a>
      </div>
    </div>
  `;
}

// ============ Utility ============
function goToPage(page) {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  params.set('page', page);
  router.navigate(`/search?${params.toString()}`);
}

window.app = { goToPage };

// ============ Router Integration ============
import router from './router.js';

init();

export { renderHome, renderSearch, renderMangaDetail, renderLibrary, renderChapterReader };