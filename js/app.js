/**
 * MangaView - Main Application (Shikimori API Version)
 */

import { anime, manga, genre, getImageUrl, getCoverUrl, formatDate, formatRelativeDate, getKindClass, getStatusClass, getScoreClass } from './api/shikimori.js';

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

// ============ Genres State ============
let allGenres = [];
let cachedGenres = false;

async function loadGenres() {
  if (cachedGenres) return;
  try {
    const genres = await genre.list();
    allGenres = genres || [];
    cachedGenres = true;
  } catch (error) {
    console.error('Failed to load genres:', error);
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
            <h1 class="hero__title">Discover Your Next Favorite Anime</h1>
            <p class="hero__description">Browse thousands of anime and manga titles from Shikimori. Track your watching progress and find new series to explore.</p>
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
            <a href="#/search?type=anime&order=ranked" class="section__link">
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
            <a href="#/search?type=manga&order=ranked" class="section__link">
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

  // Load data
  loadTopAnime();
  loadTopManga();
  loadGenresCloud();
}

async function loadTopAnime() {
  const container = document.getElementById('top-anime');
  if (!container) return;

  try {
    const data = await anime.list({ order: 'ranked', limit: 8 });
    container.innerHTML = data.length > 0
      ? data.map(item => renderAnimeCard(item, 'anime')).join('')
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
    const data = await manga.list({ order: 'ranked', limit: 8 });
    container.innerHTML = data.length > 0
      ? data.map(item => renderAnimeCard(item, 'manga')).join('')
      : '<p style="padding: 20px; color: var(--text-muted);">No manga found</p>';
    attachCardListeners(container);
  } catch (error) {
    console.error('Failed to load top manga:', error);
    container.innerHTML = '<p style="padding: 20px; color: var(--text-muted);">Failed to load</p>';
  }
}

function loadGenresCloud() {
  const container = document.getElementById('genres-cloud');
  if (!container || allGenres.length === 0) return;

  // Filter anime genres
  const animeGenres = allGenres.filter(g => g.kind === 'genre' && g.entry_type === 'Anime').slice(0, 20);
  container.innerHTML = animeGenres.map(genre => `
    <a href="#/search?genre=${genre.id}" class="filter-tag">${genre.name}</a>
  `).join('');
}

// ============ Card Renderer ============
function renderAnimeCard(item, type = 'anime') {
  const title = item.name || 'Unknown Title';
  const score = item.score && item.score !== '0.0' ? item.score : '';
  const imageUrl = getImageUrl(item.image, 'preview') || getImageUrl(item.image, 'x96');

  return `
    <article class="manga-card" data-id="${item.id}" data-type="${type}">
      <div class="manga-card__cover">
        <img src="${imageUrl}" alt="${title}" loading="lazy"
             onerror="this.parentElement.style.background='linear-gradient(135deg, var(--color-primary-dark), var(--color-secondary))'"
             class="manga-card__cover-img">
        <div class="manga-card__cover-overlay"></div>
        ${item.kind ? `<span class="manga-card__status ${getKindClass(item.kind)}">${item.kind}</span>` : ''}
        ${score ? `<span class="manga-card__rating ${getScoreClass(score)}">★ ${score}</span>` : ''}
      </div>
      <div class="manga-card__info">
        <h3 class="manga-card__title">${title}</h3>
        <div class="manga-card__meta">
          ${item.status ? `<span class="manga-card__tag">${item.status}</span>` : ''}
          ${item.episodes ? `<span class="manga-card__tag">${item.episodes} eps</span>` : ''}
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
  const kind = params.get('kind') || '';
  const status = params.get('status') || '';
  const genreId = params.get('genre') || '';
  const order = params.get('order') || 'ranked';
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
            <label class="filter-label">Status</label>
            <select class="filter-select" id="filter-status">
              <option value="">All</option>
              <option value="ongoing" ${status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
              <option value="released" ${status === 'released' ? 'selected' : ''}>Released</option>
              <option value="anons" ${status === 'anons' ? 'selected' : ''}>Anons</option>
              <option value="paused" ${status === 'paused' ? 'selected' : ''}>Paused</option>
              <option value="discontinued" ${status === 'discontinued' ? 'selected' : ''}>Discontinued</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Order</label>
            <select class="filter-select" id="filter-order">
              <option value="ranked" ${order === 'ranked' ? 'selected' : ''}>Ranked</option>
              <option value="popularity" ${order === 'popularity' ? 'selected' : ''}>Popularity</option>
              <option value="aired_on" ${order === 'aired_on' ? 'selected' : ''}>Date</option>
              <option value="name" ${order === 'name' ? 'selected' : ''}>Name</option>
            </select>
          </div>
          <div class="filter-group" style="flex: 1;">
            <label class="filter-label">Genre</label>
            <select class="filter-select" id="filter-genre">
              <option value="">All Genres</option>
              ${allGenres.filter(g => g.kind === 'genre' && g.entry_type === type).map(g =>
                `<option value="${g.id}" ${genreId === String(g.id) ? 'selected' : ''}>${g.name}</option>`
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
  performSearch(query, type, kind, status, genreId, order, page);
}

function setupSearchHandlers() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const filterType = document.getElementById('filter-type');
  const filterStatus = document.getElementById('filter-status');
  const filterOrder = document.getElementById('filter-order');
  const filterGenre = document.getElementById('filter-genre');

  const updateURL = () => {
    const q = searchInput.value.trim();
    const t = filterType.value;
    const s = filterStatus.value;
    const o = filterOrder.value;
    const g = filterGenre.value;

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('type', t);
    if (s) params.set('status', s);
    if (o !== 'ranked') params.set('order', o);
    if (g) params.set('genre', g);
    params.delete('page');

    router.navigate(`/search?${params.toString()}`);
  };

  searchBtn.addEventListener('click', updateURL);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') updateURL();
  });

  [filterType, filterStatus, filterOrder, filterGenre].forEach(el => {
    el.addEventListener('change', updateURL);
  });
}

async function performSearch(query, type, kind, status, genreId, order, page) {
  const container = document.getElementById('search-results');
  const pagination = document.getElementById('search-pagination');
  if (!container) return;

  try {
    const limit = 24;
    const api = type === 'manga' ? manga : anime;
    const params = {
      page,
      limit,
      order: order || 'ranked',
    };
    if (query) params.search = query;
    if (status) params.status = status;
    if (genreId) params.genre = genreId;

    const data = await api.list(params);

    container.innerHTML = data.length > 0
      ? data.map(item => renderAnimeCard(item, type)).join('')
      : '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No results found.</p>';

    attachCardListeners(container);

    // Simple pagination
    if (data.length >= limit) {
      const nextPage = page + 1;
      pagination.innerHTML = `
        <button class="btn btn--secondary" onclick="window.app.goToPage(${nextPage})">Load More</button>
      `;
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

  // Try anime first, then manga
  try {
    const animeData = await anime.get(id);
    renderDetail(animeData, 'anime');
  } catch {
    try {
      const mangaData = await manga.get(id);
      renderDetail(mangaData, 'manga');
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
}

function renderDetail(data, type) {
  const container = document.getElementById('manga-detail');
  if (!container) return;

  const title = data.name || 'Unknown';
  const imageUrl = getImageUrl(data.image, 'original') || getImageUrl(data.image, 'preview');
  const score = data.score && data.score !== '0.0' ? data.score : 'N/A';
  const status = data.status || '';
  const kind = data.kind || '';
  const episodes = data.episodes || 0;
  const airedOn = data.aired_on || '';
  const releasedOn = data.released_on || '';
  const description = data.description || '';
  const url = data.url || '';

  container.innerHTML = `
    <div class="manga-detail__header">
      <div class="manga-detail__cover">
        <img src="${imageUrl}" alt="${title}"
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 3 4%22%3E%3Crect fill=%22%2325253A%22 width=%223%22 height=%224%22/%3E%3C/svg%3E'">
      </div>
      <div class="manga-detail__info">
        <h1 class="manga-detail__title">${title}</h1>
        <div class="manga-detail__meta">
          ${score !== 'N/A' ? `<span class="manga-detail__score">★ ${score}</span>` : ''}
          ${kind ? `<span class="manga-detail__kind">${kind}</span>` : ''}
          ${status ? `<span class="manga-detail__status ${getStatusClass(status)}">${status}</span>` : ''}
        </div>
        <div class="manga-detail__stats">
          ${episodes ? `<div class="manga-detail__stat"><span class="label">Episodes:</span> ${episodes}</div>` : ''}
          ${data.volumes ? `<div class="manga-detail__stat"><span class="label">Volumes:</span> ${data.volumes}</div>` : ''}
          ${data.chapters ? `<div class="manga-detail__stat"><span class="label">Chapters:</span> ${data.chapters}</div>` : ''}
          ${airedOn ? `<div class="manga-detail__stat"><span class="label">Aired:</span> ${formatDate(airedOn)}</div>` : ''}
          ${releasedOn ? `<div class="manga-detail__stat"><span class="label">Released:</span> ${formatDate(releasedOn)}</div>` : ''}
        </div>
        <div class="manga-detail__actions">
          <button class="btn btn--primary" id="add-to-library-btn">Add to Library</button>
        </div>
      </div>
    </div>
    ${description ? `
    <div class="manga-detail__description">
      <h3>Synopsis</h3>
      <p>${description.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}
    <div class="manga-detail__characters">
      <h3>Characters</h3>
      <div id="characters-list" class="characters-grid">
        <span style="color: var(--text-muted);">Loading...</span>
      </div>
    </div>
  `;

  // Load characters
  loadCharacters(id, type);
}

async function loadCharacters(id, type) {
  const container = document.getElementById('characters-list');
  if (!container) return;

  try {
    const api = type === 'manga' ? manga : anime;
    const characters = await api.characters(id);
    if (characters && characters.length > 0) {
      container.innerHTML = characters.slice(0, 8).map(char => {
        const name = char.name || 'Unknown';
        const image = char.image ? getImageUrl(char.image, 'x96') : '';
        const role = char.role || '';
        return `
          <div class="character-card">
            <img src="${image}" alt="${name}" onerror="this.style.display='none'">
            <span class="character-name">${name}</span>
            <span class="character-role">${role}</span>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '<span style="color: var(--text-muted);">No characters found</span>';
    }
  } catch (error) {
    container.innerHTML = '<span style="color: var(--text-muted);">Failed to load characters</span>';
  }
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

// ============ Chapter Reader (Not supported in Shikimori) ============
async function renderChapterReader(id) {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="page page-enter">
      <div class="container" style="text-align: center; padding: 60px 0;">
        <h2>Chapter Reader</h2>
        <p style="color: var(--text-muted); margin-top: 10px;">Shikimori API does not provide chapter content. Please use the detail page to view anime/manga information.</p>
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

// Export for use in onclick
window.app = { goToPage };

// Make functions globally accessible for onclick handlers
window.renderAnimeCard = renderAnimeCard;
window.attachCardListeners = attachCardListeners;

// ============ Router Integration ============
import router from './router.js';

// Initialize on load
init();

// ============ Render Functions Export ============
export { renderHome, renderSearch, renderMangaDetail, renderLibrary, renderChapterReader };