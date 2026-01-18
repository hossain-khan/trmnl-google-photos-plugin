# Product Requirements Document (PRD)
## Project: TRMNL Google Photos Plugin  
**Goal:** Build a TRMNL plugin that displays random photos from a user’s Google Photos shared album link, similar to the existing Apple Photos plugin.

---

## 1. Overview

The TRMNL Google Photos Plugin allows users to display random images from their Google Photos shared albums on their TRMNL device. The user sets it up by supplying a shareable Google Photos album link, after which the plugin securely retrieves, caches, and presents random photos on the device.

---

## 2. Objectives

- Allow users to display photos from Google Photos shared albums on TRMNL devices.
- Mirror the Apple Photos plugin experience for a cohesive user journey.
- Handle authentication, caching, and error states gracefully.
- Respect user privacy and Google’s terms of service.

---

## 3. User Stories

- **As a TRMNL user**, I want to provide a Google Photos shared album link so I can see my photos on my TRMNL device.
- **As a user**, I want to preview which photo is currently being displayed.
- **As a privacy-conscious user**, I want assurances that my photos and data are handled securely and not shared without my consent.
- **As an admin/support**, I want to be able to investigate errors (e.g., inaccessible albums, expired links, quota issues).

---

## 4. Requirements

### 4.1 Functional Requirements

- **Album Link Setup:**  
  - Users can add/edit/remove a Google Photos public/shared album link via the TRMNL settings UI.
  - Validate the provided link (structure, accessibility).

- **Photo Retrieval:**  
  - On demand or on a schedule (e.g., daily), fetch and cache photo URLs from the shared album.
  - Randomly select and display a photo each time the plugin is rendered or refreshed.

- **Display/Preview:**  
  - Render the current photo in multiple device layouts (full, half, quadrant).
  - Allow for album preview in the web UI.

- **Error Handling:**  
  - Display user-friendly messages for album access failures, permission issues, or broken links.
  - Fallback gracefully if no images are available.

- **Administration:**  
  - Log and surface crawl/fetch errors for investigation.

### 4.2 Non-Functional Requirements

- **Performance:**  
  - Efficiently cache image lists and thumbnails.
  - Optimize for minimal network/data usage and low-latency display.

- **Reliability:**  
  - Scheduled jobs re-crawl albums for changes (new photos, removals).
  - Retries for transient failures.

- **Security & Privacy:**  
  - Do not permanently store user photos except for transient caching to enable plugin functionality.
  - Clearly document data retention and privacy in ToS.
  - No data sharing with third parties except Google and TRMNL (for the device).

- **Compliance:**  
  - Adhere to Google Photos’ API terms and privacy requirements.
  - Provide clear user-facing ToS and privacy policy for the plugin.

---

## 5. Technical Details

- **Supported Link Type:**  
  - Accept Google Photos “shared album” links ([example format](https://photos.app.goo.gl/...)).  
- **Fetching Logic:**  
  - Use public metadata APIs or page scraping if allowed, since Google Photos does not have a fully open API for shared links.
  - Fetch a list of image URLs.
- **Backend:**  
  - Scheduled worker crawls the album and updates a per-user cache (DynamoDB/S3, as in Apple plugin).
  - Expose API endpoints for front-end to get a random image and check status.
- **Frontend:**  
  - Next.js and React components to manage the UI, settings panel, and photo preview.
- **Monitoring:**  
  - Track fetch success/failure, album changes, and usage for support/diagnostics.

---

## 6. UX/UI

- **Settings Panel**: Allows pasting/editing of the shared album link, and shows validation/error states.
- **Preview Panel**: Shows the current/random photo as it appears on the TRMNL device.
- **Status/Feedback**: Informative and actionable error messages.

---

## 7. Milestones

1. **Discovery/Validation:** Research Google Photos shared album access methods and legal compliance.
2. **Backend Integration:** Implement worker and backend logic to fetch and cache shared album photos.
3. **Settings & UI:** Build web UI for setting up album link and previewing images.
4. **TRMNL Device Integration:** Render images on TRMNL device.
5. **Testing/Validation:** Validate with multiple link types, albums, and error conditions.
6. **Documentation/Launch:** ToS, privacy policy, and launch communications.

---

## 8. Open Questions & Risks

- **API access:**  
  - Google does not officially support open APIs for “shared link” access; implementation may rely on parsing public album pages, which could break if Google changes its UI or access rules.
- **Quota & Privacy:**  
  - Rate limiting and privacy implications must be considered.
- **Longevity:**  
  - Solution relies on link format/parsing; may require ongoing maintenance.

---

## 9. References

- [Apple Photos Plugin Implementation](https://github.com/zegl/trmnl-apple-photos)
- [Google Photos API Documentation](https://developers.google.com/photos/library/reference/rest)
- [TRMNL Device Info](https://usetrmnl.com/)