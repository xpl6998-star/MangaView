# Anime Website Planning Document
## Based on MangaDex API Requirements

---

## 1. Project Overview

**Project Name:** MangaView (二次元风格动漫网站)

**Core Functionality:** A web-based anime/manga browsing application that allows users to search, browse, and read manga using the MangaDex public API. Features a distinctive anime aesthetic while adhering to MangaDex's API usage policies.

**Target Users:** Anime/manga enthusiasts who want to discover and read manga content

---

## 2. MangaDex API Analysis

### 2.1 API Base Information
- **API Version:** 5.13.1
- **Base URL:** `https://api.mangadex.org`
- **Documentation:** https://api.mangadex.org/docs/
- **API Type:** REST API with JSON responses

### 2.2 Acceptable Usage Policy (MUST COMPLY)
- ✅ Public and free API
- ✅ MUST credit MangaDex
- ✅ MUST credit scanlation groups and honor removal requests
- ❌ CANNOT run ads or paid services
- ✅ May accept donations

### 2.3 Connection Requirements
- HTTP/1.1, HTTP/2, HTTP/3 over QUIC
- **SSL/TLS REQUIRED** (plain-text requests redirect to HTTPS)
- TLSv1.2 (deprecated) and TLSv1.3 required
- **User-Agent header MUST be set** (cannot be spoofed)
- **Via header NOT allowed** (non-transparent proxies prohibited)
- **CORS NOT provided** - MUST proxy requests and inject own CORS headers
- **Image hotlinking prohibited** - MUST proxy image requests

### 2.4 Rate Limits
| Type | Limit |
|------|-------|
| Global Rate Limit | ~5 requests/second/IP |
| GET /manga/random | 60 requests/minute |
| POST /chapter/{id}/read | 300 requests/10 minutes |
| POST /manga | 10 requests/minute |
| GET /at-home/server/{id} | 40 requests/minute |

### 2.5 Collection Result Sizes
- `offset + size > 10,000` → rejected
- `size` max typically `100` (some feed endpoints `500`)
- Must use pagination for large results

---

## 3. API Endpoints Structure

### 3.1 Authentication
- `POST /auth/login` - Login (30 requests/hour)
- `POST /auth/refresh` - Refresh token (60 requests/hour)

### 3.2 Manga
- `GET /manga` - List/search manga
- `GET /manga/{id}` - Get manga details
- `GET /manga/random` - Get random manga
- `POST /manga` - Create manga (authenticated)
- `PUT /manga/{id}` - Update manga
- `GET /manga/{id}/feed` - Get chapter feed

### 3.3 Chapters
- `GET /chapter` - Search chapters
- `GET /chapter/{id}` - Get chapter details
- `POST /chapter/{id}/read` - Mark as read (300 requests/10 min)
- `GET /at-home/server/{id}` - Get chapter reading server

### 3.4 Covers
- `GET /cover` - Search covers
- `GET /cover/{id}` - Get cover details

### 3.5 Author
- `GET /author` - Search authors
- `GET /author/{id}` - Get author details

### 3.6 Scanlation Group
- `GET /group` - Search groups
- `GET /group/{id}` - Get group details

### 3.7 Static Data
- Tags, Demographics, Status, Content Ratings
- `GET /manga/tag` - Get all tags
- Enumerations for: publication demographics, status, reading status, content rating

---

## 4. Website Architecture

### 4.1 Page Structure

```
/
├── index.html              # Homepage with featured manga
├── search.html             # Search and filter manga
├── manga/
│   └── [id]/ # Manga detail page
│       ├── index.html      # Overview, chapters, related
│       └── read/
│           └── [chapterId]/ # Chapter reader
├── author/
│   └── [id]/               # Author page
├── group/
│   └── [id]/               # Scanlation group page
├── library.html # User's reading list
├── login.html              # Authentication
└── about.html              # Credits and info
```

### 4.2 Core Features

#### Homepage
- Hero banner with featured manga carousel
- Latest updates section
- Popular manga grid
- Genre/Tag cloud navigation
- Search bar

#### Search & Discovery
- Multi-filter search (title, author, tags, status, rating)
- Sort options: title, year, createdAt, latestUploadedChapter, followedCount, relevance
- Pagination with offset/size parameters
- Language filter (ISO 639-1 codes)

#### Manga Detail Page
- Cover image (proxy required)
- Title, alternative titles, description
- Author/Artist links
- Tags (with IDs)
- Publication demographics (shounen/shoujo/josei/seinen)
- Status (ongoing/completed/hiatus/cancelled)
- Content rating (safe/suggestive/erotica/pornographic)
- Chapter list with group attribution
- Statistics
- External links (MAL, AniList, Kitsu, etc.)
- Related manga

#### Chapter Reader
- Page-by-page reading
- MangaDex@Home image serving
- Pre-loading next pages
- Reading progress tracking

#### User Library (Local Storage)
- Reading status: reading, on_hold, plan_to_read, dropped, re_reading, completed
- Custom lists
- Local storage (no auth required for basic features)

### 4.3 Technical Stack

```
Frontend:
- HTML5 + CSS3 + JavaScript (Vanilla ES6+)
- CSS Grid/Flexbox for layouts
- CSS Custom Properties for theming

Styling:
- Anime-inspired color palette
- Responsive design (mobile-first)
- Dark/Light theme support
- Font: Noto Sans/Noto Serif for CJK support

Features:
- Service Worker for offline caching
- LocalStorage for user preferences
- Proxy layer for CORS compliance
- Rate limit handling with retry logic

API Client:
- Fetch API with error handling
- Request queuing (5 req/sec limit)
- Response caching
- X-Request-ID for debugging
```

---

## 5. Design Specification (二次元风格)

### 5.1 Color Palette

```css
:root {
  /* Primary - Cherry Blossom Pink */
  --color-primary: #FFB7C5;
  --color-primary-dark: #E896A3;
  --color-primary-light: #FFE4E8;

  /* Secondary - Twilight Purple */
  --color-secondary: #9B7BB8;
  --color-secondary-dark: #7A5F9A;
  --color-secondary-light: #C4B0D9;

  /* Accent - Sky Blue */
  --color-accent: #7EC8E3;
  --color-accent-dark: #5AADCC;
  --color-accent-light: #B5E3F5;

  /* Background */
  --bg-dark: #1A1A2E;
  --bg-card: #25253A;
  --bg-elevated: #2D2D44;
  --bg-light: #F5F5F7;

  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #B8B8C8;
  --text-muted: #8888A0;
  --text-dark: #2A2A3A;

  /* Status Colors */
  --status-safe: #7EC8E3;
  --status-suggestive: #FFB347;
  --status-erotica: #FF6B6B;
  --status-pornographic: #CC0000;
}
```

### 5.2 Typography

```css
/* Japanese-friendly fonts */
--font-heading: 'Noto Serif JP', 'Shippori Mincho', serif;
--font-body: 'Noto Sans JP', 'M PLUS1p', sans-serif;

/* English fallback */
--font-heading-en: 'Crimson Pro', 'Playfair Display', serif;
--font-body-en: 'Inter', 'Source Sans Pro', sans-serif;
```

### 5.3 Layout Components

#### Cards
- Manga card with cover image (aspect ratio 3:4)
- Hover effect with subtle scale and glow
- Tags displayed as pills
- Rating indicator

#### Navigation
- Sticky header with blur effect
- Hamburger menu for mobile
- Breadcrumb trail on subpages

#### Grid Layouts
- Homepage: 4-column masonry for manga grid
- Search results: 3-column responsive grid
- Chapter list: 2-column on mobile, 1-column on desktop

#### Modals
- Quick view modal for manga details
- Image lightbox for covers
- Login/Register modal

### 5.4 Animations

```css
/* Card hover */
.manga-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(155, 123, 184, 0.3);
}

/* Page transitions */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}
.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.4s ease-out;
}

/* Loading skeleton */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-card) 25%,
    var(--bg-elevated) 50%,
    var(--bg-card) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### 5.5 Special Visual Elements

- **Cherry blossom particles** (CSS animation)
- **Gradient overlays** on hero images
- **Neon glow effects** on interactive elements
- **Soft shadows** with colored tints
- **Decorative patterns** (wave, dot grid)

---

## 6. Implementation Phases

### Phase 1: Foundation
- [ ] Project setup (HTML structure, CSS variables)
- [ ] API client with rate limiting
- [ ] Basic routing system
- [ ] Homepage layout

### Phase 2: Core Features
- [ ] Search functionality
- [ ] Manga detail page
- [ ] Chapter listing
- [ ] Pagination handling

### Phase 3: Reader
- [ ] Chapter reader
- [ ] MangaDex@Home integration
- [ ] Image proxy service
- [ ] Reading progress

### Phase 4: User Features
- [ ] Local storage library
- [ ] Reading status tracking
- [ ] Theme switching
- [ ] Responsive refinements

### Phase 5: Polish
- [ ] Animations and transitions
- [ ] Error handling
- [ ] Loading states
- [ ] Accessibility audit

---

## 7. API Compliance Checklist

### Rate Limiting
- [ ] Implement request queue (max 5/sec)
- [ ] Handle429 responses with retry-after
- [ ] Monitor X-RateLimit-* headers

### Headers
- [ ] Set proper User-Agent (non-spoofed)
- [ ] Remove Via headers
- [ ] Handle X-Request-ID for debugging

### CORS / Proxy
- [ ] Implement image proxy (mandatory)
- [ ] Inject CORS headers in API responses
- [ ] Handle CORS errors gracefully

### Attribution
- [ ] Display MangaDex credit
- [ ] Show scanlation group names
- [ ] Honor removal requests display

### Pagination
- [ ] Use offset/size parameters
- [ ] Enforce offset + size <= 10,000
- [ ] Handle empty results

---

## 8. Data Models

### Manga Object
```typescript
interface Manga {
  id: string;
  type: 'manga';
  attributes: {
    title: { [lang: string]: string };
    altTitles: Array<{ [lang: string]: string }>;
    description: { [lang: string]: string };
    originalLanguage: string;
    lastChapter: string | null;
    lastVolume: string | null;
    publicationDemographic: 'shounen' | 'shoujo' | 'josei' | 'seinen' | null;
    status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
    contentRating: 'safe' | 'suggestive' | 'erotica' | 'pornographic';
    tags: Tag[];
    createdAt: string; // ISO 8601
    updatedAt: string;
    version: number;
  };
  relationships: Relationship[];
}
```

### Chapter Object
```typescript
interface Chapter {
  id: string;
  type: 'chapter';
  attributes: {
    volume: string | null;
    chapter: string | null;
    title: string | null;
    translatedLanguage: string;
    readableAt: string;
    createdAt: string;
    updatedAt: string;
    pages: number;
  };
  relationships: Relationship[];
}
```

### Relationship Types
```typescript
type RelationshipType = 
  | 'manga' | 'chapter' | 'cover_art'
  | 'author' | 'artist' | 'scanlation_group'
  | 'tag' | 'user' | 'custom_list';
```

---

## 9. Error Handling

### HTTP Error Codes
| Code | Handling |
|------|----------|
| 400 | Bad Request - log X-Request-ID, show user message |
| 403 | Forbidden - check if IP banned |
| 404 | Not Found - handle gracefully |
| 429 | Rate Limited - wait X-RateLimit-Retry-After |
| 500 | Server Error - retry with backoff |
| 503 | Service Unavailable - show maintenance message |

### Client-Side Errors
- Network failures → retry with exponential backoff
- CORS errors → use proxy
- Image load failures → show placeholder

---

## 10. File Structure

```
mangadex-website/
├── index.html
├── search.html
├── login.html
├── library.html
├── about.html
├── manga/
│   └── [id]/
│       └── index.html
├── chapter/
│   └── [id]/
│       └── index.html
├── css/
│   ├── variables.css
│   ├── reset.css
│   ├── typography.css
│   ├── layout.css
│   ├── components.css
│   └── animations.css
├── js/
│   ├── api/
│   │   ├── client.js
│   │   ├── rate-limiter.js
│   │   └── endpoints.js
│   ├── router.js
│   ├── store.js
│   ├── utils.js
│   └── main.js
├── assets/
│   ├── icons/
│   └── images/
└── sw.js
```

---

## 11. External Links Integration

Support for these external links in manga data:
- `al` → AniList
- `ap` → Anime-Planet
- `bw` → Bookwalker
- `mu` → MangaUpdates
- `nu` → NovelUpdates
- `kt` → Kitsu
- `mal` → MyAnimeList
- `amz` → Amazon
- `ebj` → EbookJapan
- `cdj` → CDJapan

---

## 12. Credits / About Page Content

```
MangaView - 二次元风格动漫网站

Powered by MangaDex API

MangaDex is an ad-free manga reader offering high-quality images.
This website uses the MangaDex public API in compliance with their
Acceptable Usage Policy.

We credit MangaDex and all scanlation groups for their work.
Content removal requests are honored promptly.

API Documentation: https://api.mangadex.org/docs/

Join our Discord for updates and community.

©2025 MangaView. All rights reserved.
MangaDex™ is a trademark of their respective owners.
```