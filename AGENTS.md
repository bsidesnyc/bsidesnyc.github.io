# BSidesNYC Website — Architecture Guide for AI Agents

## What this is

A Jekyll static site for BSidesNYC. Hosted on GitHub Pages. This site has been modernized to use **Bootstrap 5.3.3** and native browser APIs, significantly reducing legacy dependencies like jQuery.

## Quick orientation

```
_config.yml         ← single source of truth for event config (dates, venue, top nav)
_data/              ← YAML content files (speakers, sponsors, sessions, villages, archive/YYYY)
_includes/          ← reusable HTML partials
_layouts/           ← default.html (master layout) + compress.html (HTML minifier)
_sass/              ← modular SCSS
js/                 ← custom JS (ES6+ standardized)
```

Pages are simple HTML files with YAML front matter (`layout: default`, `permalink: /foo/`).

---

## Configuration (_config.yml)

Key sections:
- `year`, `date`, `location`: Current conference metadata.
- `navigationLinks`: Top-nav items.
- `sessionize.*`: API endpoint URLs for schedule and speaker data.

---

### Layouts & Styles

### `_layouts/default.html`
Master layout. Modernized features:
- **Bootstrap 5.3.3**: Loaded via CDN.
- **Zero jQuery**: The site is now fully Vanilla JS. jQuery has been removed entirely.
- **Optimized Font Loading**: Uses `preconnect` and `font-display: swap` in the `<head>` for near-instant text rendering.
- **Preloaded LCP**: Critical assets like the hero logo are preloaded.
- **Modular JS**: Logic for specific pages (Archive, Map) is split into standalone files and loaded with `defer`.

### CSS / SCSS
Entry point: `css/main.scss` pulls from `_sass/main.scss`.
- **Custom Theme**: Bootstrap 5 primary colors are overridden in `_sass/partials/_base.scss` using CSS variables (`--bs-primary`).
- **Slim Animations**: Only used animations (fadeIn variants) are imported to keep the CSS payload minimal.
- **Smooth Transitions**: Uses hardware-accelerated CSS `transform: scale()` for card zooms.
- **Native Effects**: Replaced `waves.js` ripple with modern CSS `:active` feedback.
- **Inline SVG Icons**: Replaced external sprite sheets and logo files with an internal `<symbol>` library in `_includes/svg-icons.html` for zero-request icon and logo loading.

---

## JavaScript

### Data flow
Dynamic pages fetch data via the Sessionize API using `fetch()`. The codebase uses **ES6+ syntax** (`const`, `let`, arrow functions, `.forEach()`, `.find()`).

| File | Responsibility |
|---|---|
| `js/scripts.js` | Global behaviors: Sticky header (native scroll listener), IntersectionObserver for animations. |
| `js/schedule.js` | Builds the schedule table and session modals. |
| `js/speakers.js` | Builds the speaker grid. Cards "fill in" individually as images load. |
| `js/utils.js` | **Centralized Utilities**: Contains `createBootstrapModal`, `addSessionContentToModal`, and `addSpeakerContentToModal` to ensure UI consistency. |
| `js/archive.js` | Video modal logic and URL parsing for the Archive page. Utilizes **Plyr.js** for unified playback. |
| `js/map.js` | Google Maps initialization and configuration. |

### Key Architectural Patterns
- **Unified Video Player**: Plyr.js is used on the Archive page to stream direct `.mp4` links from `archive.org` and handle YouTube embeds with a consistent UI.
- **Native Sticky**: Schedule track headers use CSS `position: sticky` instead of JavaScript plugins.
- **Performance**: IntersectionObserver is used for all scroll-triggered animations.

---

## Common tasks

**Update conference date/venue**: Edit `_config.yml`.

**Add a sponsor**: Add entry to `_data/sponsors.yml` under the correct tier. Update image in `img/sponsors/`.

**Add a new archive year**:
1. Create `_data/archive/YYYY.yml`.
2. Edit `archive.html` and add `{% include archive-year.html year="YYYY" %}`.

**Update track→room mapping**: Edit `trackToRoomElements()` in `js/utils.js`.

---

## Build / local dev

```bash
bundle install
bundle exec jekyll serve
```
GitHub Pages handles the production build automatically on push to `master`.
