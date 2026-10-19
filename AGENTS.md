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
- **Bootstrap 5.3.3**: Self-hosted in `lib/bootstrap-5.3.3/` (byte-identical to the jsDelivr files). The JS loads `async`: it's only needed once someone taps.
- **Zero jQuery**: The site is now fully Vanilla JS. jQuery has been removed entirely.
- **Self-hosted font**: Roboto is one variable woff2 in `fonts/roboto/` (`@font-face` in `_sass/partials/_fonts.scss`, `font-display: swap`). Deliberately not preloaded, so it doesn't compete with the CSS on a thin connection.
- **No render-critical third parties**: CSS, JS and fonts all come from this site; only the Sessionize data is fetched from elsewhere.
- **Preloaded LCP**: The home page hero logo is preloaded (home page only).
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
| `js/schedule.js` | Builds the schedule table and session modals. `loadSchedule()` uses the download the layout starts in `<head>` (`window.earlyFetch`), retries with `fetchJson()`, keeps the last good copy in localStorage and falls back to it with a note. On the event day it marks the slot that's on now and scrolls to it (test with `?now=2026-10-17T13:20`). |
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

**Add a partner**: Add an entry to `_data/partners.yml` (shown under the sponsor tiers on `/sponsors/`). `imageUrl` (in `img/sponsors/`) is optional; without it the card shows the name as text.

**Add a new archive year**:
1. Create `_data/archive/YYYY.yml`.
2. Edit `archive.html` and add `{% include archive-year.html year="YYYY" %}`.

Archive speakers carry `bio` and `photo` (a local copy, `/img/archive/YYYY/speakers/<name>.webp`, ≤400px) so they survive Sessionize dropping old events; save the raw Sessionize exports in `_data/archive/raw/` too. Sessions can add `links` (`{label, url}`) for extra buttons.

**Update track→room mapping**: Edit `trackToRoomElements()` in `js/utils.js`.

**Section background photos**: Use `{% include bg-image-style.html img=... %}` for the inline style. If `img/sections-background/<name>-sm.webp` exists (828px wide, ~quality 60), phones get it instead. A page can drop its hero photo on phones with `mobileHero: false` in its front matter (the schedule does).

**Update venue maps**: The stacked all-floors overview on `/map/` is drawn from `_data/venue_overview.yml` (rough west→east positions, not to scale). Each floor's clean plan is an SVG fragment in `_includes/floorplans/`, listed under `venueFloorMaps` in `_config.yml` (`svg`, plus `image` for the original architectural plan in `img/venue/`); `_includes/floorplan-svg.html` wraps a fragment in the shared frame.

**Printable venue map**: `img/venue-map-print.svg` (plus `-level-1` and `-hound-square` "YOU ARE HERE" versions) is built by Jekyll from the same `_data/venue_overview.yml` as the website's map, 2:1 like the 2025 signs. Drawn by `_includes/venue-map-print.svg`; each sign version is a three-line page in `img/` naming the floor, the spot the sign stands at and which side the label goes. Its colours mirror the SCSS ones, so keep them in step.

**Room-map popup**: Room names in the schedule and session popups open `showRoomMap()` (`js/utils.js`), which clones that floor from the `<template>`s in `_includes/floorplan-templates.html` (included on `/schedule/` and `/speakers/`) and highlights the room. A track's `room` in `trackToRoomElements()` must match a `data-room` attribute in the floor SVG; its `directions` text is shown above the plan.

---

**Offline support (service worker)**: `sw.js` (Jekyll-built) caches the event-day pages, their CSS/JS/font and the Sessionize data so phones keep working with bad or no signal. Switch and notes: "Offline support" in `_config.yml`.
- Pages and Sessionize data are network-first and revalidate with the server (`cache: "no-cache"`), falling back to the saved copy only after a few seconds without an answer. Sessionize edits need no action; an open schedule page also re-checks every 10 minutes and when brought back to the front (`recheckSchedule()` in `js/schedule.js`).
- Each deploy gets its own cache (`bsidesnyc-<build time>`); old ones are deleted. Local CSS/JS URLs carry `?v=<build time>` (`assetVersion` in the layout), so a page never runs with an older cached script. When adding a local CSS/JS tag, append `assetVersion` the same way.
- Saved copies of Sessionize data carry an `X-Saved-At` header; the schedule shows "the copy saved on your phone at ..." when it gets one.
- A new deploy carries over anything its install couldn't fetch from the old cache before deleting it, so a dropped connection mid-deploy never wipes a phone's offline copy. Pages and Sessionize retry once on a dropped connection; a never-saved page offline gets a small "No signal" page linking to the saved ones.
- Off switch: `serviceWorker.enabled: false` makes `sw.js` remove itself and its caches, and the layout unregisters it.

**Inline `<script>`s in layouts/includes**: `_layouts/compress.html` minifies HTML onto one line, so use `/* */` comments in inline scripts - a `//` comment swallows the rest of the script.

## Build / local dev

```bash
bundle install
bundle exec jekyll serve
```
GitHub Pages handles the production build automatically on push to `master`.
