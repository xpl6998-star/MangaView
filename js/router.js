/**
 * Simple Hash-based Router for SPA
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.params = {};

    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('DOMContentLoaded', () => this.handleRoute());
  }

  /**
   * Register a route
   * @param {string} pattern - Route pattern (e.g., '/manga/:id')
   * @param {Function} handler - Handler function
   */
  addRoute(pattern, handler) {
    this.routes.set(pattern, handler);
  }

  /**
   * Navigate to a path
   * @param {string} path - Path to navigate to
   */
  navigate(path) {
    window.location.hash = path;
  }

  /**
   * Get current path without hash and query string
   * @returns {string} Current path
   */
  getCurrentPath() {
    const hash = window.location.hash.slice(1) || '/';
    // Strip query string if present
    return hash.split('?')[0];
  }

  /**
   * Match a route pattern to a path
   * @param {string} pattern - Route pattern
   * @param {string} path - Current path
   * @returns {Object|null} Match result with params
   */
  matchRoute(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean) || ['/'];

    if (patternParts.length !== pathParts.length) {
      // Handle root path
      if (pattern === '/' && (path === '' || path === '/')) {
        return { match: true, params: {} };
      }
      return { match: false, params: {} };
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        // This is a parameter
        params[patternPart.slice(1)] = pathPart;
      } else if (patternPart === '*') {
        // Wildcard - matches anything
      } else if (patternPart !== pathPart) {
        return { match: false, params: {} };
      }
    }

    return { match: true, params };
  }

  /**
   * Handle the current route
   */
  async handleRoute() {
    const path = this.getCurrentPath();

    // Try to match routes in order
    for (const [pattern, handler] of this.routes) {
      const { match, params } = this.matchRoute(pattern, path);

      if (match) {
        this.currentRoute = pattern;
        this.params = params;

        try {
          await handler({ path, params, route: pattern });
        } catch (error) {
          console.error('Route handler error:', error);
          this.showError('Failed to load page');
        }
        return;
      }
    }

    // No route matched - show 404
    this.showError('Page not found');
  }

  /**
   * Show error page
   * @param {string} message - Error message
   */
  showError(message) {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="page">
          <div class="container" style="text-align: center; padding: 80px 0;">
            <h1 style="font-size: 4rem; color: var(--color-primary); margin-bottom: 16px;">404</h1>
            <p style="color: var(--text-secondary); margin-bottom: 24px;">${message}</p>
            <a href="#/" class="btn btn--primary">Go Home</a>
          </div>
        </div>
      `;
    }
  }
}

// Create singleton instance
const router = new Router();

// Route definitions
router.addRoute('/', async () => {
  const { renderHome } = await import('./app.js');
  await renderHome();
});

router.addRoute('/search', async () => {
  const { renderSearch } = await import('./app.js');
  await renderSearch();
});

router.addRoute('/manga/:id', async ({ params }) => {
  const { renderMangaDetail } = await import('./app.js');
  await renderMangaDetail(params.id);
});

router.addRoute('/chapter/:id/read', async ({ params }) => {
  const { renderChapterReader } = await import('./app.js');
  await renderChapterReader(params.id);
});

router.addRoute('/library', async () => {
  const { renderLibrary } = await import('./app.js');
  await renderLibrary();
});

export default router;