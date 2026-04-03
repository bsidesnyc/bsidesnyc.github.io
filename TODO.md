# BSidesNYC TODO List

## High Priority Architectural Improvements

* **Hard-coded track→room mapping:** Move the track-to-room mapping in `trackToRoomElements()` out of `js/utils.js` and into `_config.yml` (under a `tracks` key). This will make it easier for organizers to update room assignments for new conference years without touching JavaScript.
* **Sponsor Tier Logic in HTML:** Refactor `_includes/sponsors.html` to be purely data-driven. Move column sizes (`col-lg-3`, etc.) and CSS classes for each tier directly into `_data/sponsors.yml` so the template becomes a simple, logic-free loop.
* **Consolidate Dynamic "Add Speaker Card" logic:** `js/schedule.js` and `js/speakers.js` still share code for building the actual speaker *cards* (headshots and ribbons). Extract this into a shared `createSpeakerCard()` utility in `js/utils.js`.

## Content & Backlog Fixes

* **Image Optimization:** Document the workflow for resizing and compressing images to `.webp` format and add a helper script for automated optimization.
* **Dockerized Build:** Switch the local development environment to a Docker container that pins the Ruby and Jekyll versions to match GitHub Pages exactly.

