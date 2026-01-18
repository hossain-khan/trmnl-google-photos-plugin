# Product Requirements Document (PRD)

## TRMNL Plugin: Google Photos Shared Album Display

**Document Version:** 1.0  
**Last Updated:** January 18, 2026  
**Status:** Draft  
**Owner:** Product Team  

---

## Executive Summary

Build a TRMNL plugin that displays random photos from Google Photos shared albums using only a shared album link, providing a seamless user experience similar to the existing Apple Photos plugin without requiring OAuth authentication.

---

## 1. Problem Statement

### Current State
- TRMNL users can display Apple Photos from shared albums by simply pasting a link
- Google Photos users cannot achieve similar functionality without complex OAuth setup
- Existing Google Photos TRMNL plugin requires OAuth authentication and manual photo picker selection
- Users with Google Photos shared albums want a "paste and display" experience

### Pain Points
1. **Complex Setup**: OAuth flow requires 5+ steps and Google Cloud project creation
2. **Poor UX**: Users must manually select individual photos instead of sharing entire albums
3. **Platform Inequality**: Apple Photos users have simpler experience than Google Photos users
4. **Friction**: OAuth consent screens deter non-technical users

### User Need
> "As a TRMNL user, I want to paste my Google Photos shared album link and have random photos automatically display on my device, just like the Apple Photos plugin."

---

## 2. Goals & Success Metrics

### Primary Goals
1. **Simplicity**: Match Apple Photos plugin UX (paste link → photos display)
2. **No Authentication**: Avoid OAuth or Google account linking
3. **Reliability**: 99%+ uptime for photo fetching
4. **Performance**: Photo refresh in <3 seconds

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Plugin Installation Rate | 500+ installs in first month | TRMNL analytics |
| Setup Completion Rate | >80% (users who start setup finish) | Funnel analysis |
| Average Setup Time | <2 minutes | Time tracking |
| User Satisfaction (NPS) | >40 | Post-setup survey |
| Photo Fetch Success Rate | >95% | Error logging |
| Retention (30-day) | >60% | Active users after 30 days |

### Non-Goals
- Video support (photos only in v1.0)
- Private/non-shared album access
- Real-time sync (<1 hour latency acceptable)
- Multiple album support per user

---

## 3. User Personas

### Primary:  Casual Photo Enthusiast
- **Demographics**: 25-45 years old, tech-comfortable but not developer
- **Behavior**: Shares family photos via Google Photos, owns TRMNL device
- **Motivation**: Display rotating family photos on desk/wall
- **Pain Point**: Doesn't want to "connect apps" or manage OAuth tokens

### Secondary: Small Business Owner
- **Demographics**: 30-55 years old, uses Google Workspace
- **Behavior**: Shares product photos, office events
- **Motivation**: Display product showcase or team photos in office
- **Pain Point**: IT policies may restrict OAuth app connections

---

## 4. User Stories

### Core User Stories

**US-001**:  As a user, I want to paste my Google Photos shared album URL into the plugin settings, so I can quickly set up photo display. 

**US-002**: As a user, I want random photos from my shared album to display on TRMNL, so I see variety without manual selection.

**US-003**: As a user, I want the plugin to refresh photos periodically, so new photos I add to the album appear automatically.

**US-004**:  As a user, I want clear error messages if my link doesn't work, so I know how to fix setup issues.

**US-005**:  As a user, I want to preview photos in different TRMNL sizes before finalizing setup, so I know how they'll look.

### Future User Stories (Out of Scope for v1.0)

**US-006**: As a user, I want to display photos from multiple Google Photos albums. 

**US-007**: As a user, I want to filter photos by date range or person.

---

## 5. Functional Requirements

### 5.1 Album Setup

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Accept Google Photos shared album URL as input | P0 | Must support all Google Photos shared link formats |
| FR-002 | Validate URL format before processing | P0 | Provide instant feedback |
| FR-003 | Extract album ID from URL | P0 | Support URL format changes |
| FR-004 | Display user-friendly error for invalid URLs | P1 | Suggest correct URL format |
| FR-005 | Allow URL update after initial setup | P1 | No need to reinstall plugin |

### 5.2 Photo Retrieval

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-006 | Fetch photo metadata from shared album | P0 | Without OAuth |
| FR-007 | Filter photos (exclude videos, corrupted files) | P0 | Photos only |
| FR-008 | Select random photo on each TRMNL refresh | P0 | Weighted random if possible |
| FR-009 | Cache album metadata for 24 hours | P1 | Reduce API calls |
| FR-010 | Support albums with 1-10,000 photos | P1 | Handle pagination |

### 5.3 Photo Display

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-011 | Render photos in all TRMNL sizes (full, half, quadrant) | P0 | Server-side rendering |
| FR-012 | Optimize image resolution for e-ink display | P0 | 1024x1024 max |
| FR-013 | Display placeholder text when no photos available | P1 | Helpful error message |
| FR-014 | Show photo credit/caption if available | P2 | From Google metadata |

### 5.4 Background Processing

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-015 | Refresh album metadata daily via cron job | P0 | Midnight UTC |
| FR-016 | Retry failed fetches with exponential backoff | P1 | Max 3 retries |
| FR-017 | Log errors to monitoring system | P1 | For debugging |
| FR-018 | Track render count and last render time | P2 | Analytics |

### 5.5 User Experience

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-019 | Provide preview page showing random photos in all sizes | P0 | Before going live |
| FR-020 | Display "Last Updated" timestamp on preview | P1 | User confidence |
| FR-021 | Provide "Back to TRMNL" button after setup | P1 | Clear navigation |
| FR-022 | Mobile-responsive settings page | P1 | Setup on any device |

---

## 6. Technical Requirements

### 6.1 Technical Approach Analysis

#### **Option A: Reverse Engineer Google Photos Shared Album API** (Recommended)
**Approach**:  Similar to Apple Photos plugin - discover undocumented endpoints

**Pros:**
- No OAuth required
- Simple user experience (paste link)
- Stateless architecture
- Low infrastructure costs

**Cons:**
- Against Google ToS (gray area)
- API could break without notice
- No official support
- Potential for IP blocking

**Risk Level:** High (legal/ToS), Medium (technical)

#### **Option B: Web Scraping Shared Album Pages**
**Approach**: Parse HTML from public shared album pages

**Pros:**
- No authentication needed
- Works with public links

**Cons:**
- Very brittle (HTML changes break it)
- Requires headless browser (expensive)
- Against Google ToS
- High latency

**Risk Level:** Very High

#### **Option C: Official Google Photos API with Shared Albums**
**Approach**: Use official API with special shared album access

**Pros:**
- Official, supported
- Won't break unexpectedly

**Cons:**
- **This API doesn't exist for shared albums**
- Still requires OAuth
- Doesn't meet PRD goals

**Risk Level:** Low (technical), but doesn't solve problem

#### **Option D: Hybrid - Photo Picker API with Link Detection**
**Approach**: Use existing OAuth approach but detect shared albums

**Pros:**
- Official API
- Legitimate

**Cons:**
- Still requires OAuth (defeats purpose)
- Doesn't simplify UX

**Risk Level:** Low, but doesn't meet requirements

### 6.2 Recommended Architecture (Option A)

```
┌─────────────────┐
│  User Pastes    │
│  Shared Album   │
│     Link        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Extract Album ID           │
│  from URL fragment          │
│  (regex parsing)            │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Discover Google's          │
│  Undocumented Endpoints     │
│  - Test various URL patterns│
│  - Identify data structure  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Fetch Album Metadata       │
│  - Photo list               │
│  - Thumbnails               │
│  - Full-size URLs           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Cache in S3                │
│  - 24hr TTL                 │
│  - Per-user storage         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Select Random Photo        │
│  On TRMNL Request           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Return Image URL or Proxy  │
│  Render HTML for TRMNL      │
└─────────────────────────────┘
```

### 6.3 Technology Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| **Framework** | Next.js 15 (App Router) | Matches existing codebase, SSR support |
| **Language** | TypeScript | Type safety, existing expertise |
| **Database** | AWS DynamoDB | Serverless, matches existing architecture |
| **File Storage** | AWS S3 | Album metadata caching |
| **CDN/Proxy** | Vercel Blob or S3 + CloudFront | Image delivery |
| **Job Queue** | Hatchet | Existing integration for background jobs |
| **Validation** | Zod | Schema validation |
| **Monitoring** | Sentry + CloudWatch | Error tracking, logging |
| **Deployment** | Vercel (web) + Fly.io (worker) | Existing infrastructure |

### 6.4 Data Schema

**DynamoDB Table:  `trmnl_google_photos_shared`**

```typescript
{
  id: string;                      // user_uuid (partition key)
  user:  string;                    // TRMNL user object (JSON)
  shared_album_url: string;        // Original URL provided by user
  album_id: string;                // Extracted album identifier
  album_metadata_s3_key: string;   // S3 key for cached metadata
  last_crawl_at: number;           // Unix timestamp
  crawl_status: string;            // 'success' | 'error' | 'pending'
  photo_count: number;             // Number of photos in album
  render_count: number;            // Analytics
  last_render_at: number;          // Unix timestamp
  created_at: number;              // Unix timestamp
  updated_at: number;              // Unix timestamp
  error_message?:  string;          // Last error if failed
}
```

**S3 Object: Album Metadata**
```json
{
  "album_id": "ABC123XYZ",
  "fetched_at": "2026-01-18T10:30:00Z",
  "photo_count": 142,
  "photos": [
    {
      "id": "photo_guid_1",
      "url": "https://...",
      "thumbnail_url": "https://...",
      "width": 4032,
      "height": 3024,
      "type": "photo"
    }
  ]
}
```

### 6.5 API Endpoints

#### **Web Application Routes**

| Route | Method | Purpose |
|-------|--------|---------|
| `/google-shared/` | GET | Landing page, installation instructions |
| `/google-shared/settings? uuid={user_uuid}` | GET | Settings page - paste album URL |
| `/google-shared/settings` | POST | Save album URL, trigger initial crawl |
| `/google-shared/preview? uuid={user_uuid}` | GET | Preview random photos in all sizes |

#### **TRMNL Integration Routes**

| Route | Method | Purpose |
|-------|--------|---------|
| `/google-shared/markup` | POST | Return HTML markup for TRMNL device |
| `/google-shared/webhook/install` | POST | Handle plugin installation |
| `/google-shared/webhook/uninstall` | POST | Handle plugin uninstallation |

#### **Background Jobs**

| Job | Schedule | Purpose |
|-----|----------|---------|
| `refresh-all-albums-cron` | Daily 00:00 UTC | Refresh all user albums |
| `refresh-single-album` | On-demand | Refresh specific user's album |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metric | Target | Notes |
|--------|--------|-------|
| Initial Setup Time | <3 seconds | URL validation to confirmation |
| Photo Fetch Latency | <2 seconds | 95th percentile |
| Album Crawl Time | <30 seconds | For albums with <5000 photos |
| TRMNL Markup Response | <1 second | 99th percentile |
| Uptime | 99.5% | Measured monthly |

### 7.2 Scalability

| Dimension | Target | Strategy |
|-----------|--------|----------|
| Concurrent Users | 10,000 | DynamoDB auto-scaling |
| Photos per Album | 10,000 | Pagination, chunked processing |
| Daily Requests | 1M+ | CloudFront CDN, edge caching |
| Background Job Queue | 1000 jobs/min | Hatchet concurrency limits |

### 7.3 Security

| Requirement | Implementation |
|-------------|----------------|
| URL Validation | Regex + domain whitelist (photos.google.com, photos.app. goo.gl) |
| Input Sanitization | Zod schema validation on all inputs |
| Rate Limiting | 100 requests/minute per user |
| HTTPS Enforcement | All connections TLS 1.2+ |
| Secret Management | AWS Secrets Manager for API keys |
| CORS Policy | Restrict to TRMNL domains |

### 7.4 Privacy & Compliance

| Concern | Mitigation |
|---------|------------|
| **GDPR Compliance** | Store only user UUID, album URL, render metrics.  No PII. |
| **Data Retention** | Delete user data within 30 days of plugin uninstall |
| **Photo Storage** | Do NOT store actual photos, only URLs/metadata |
| **Shared Album Access** | Only access publicly-shared albums (same as pasting link in browser) |
| **Google ToS** | ⚠️ **Risk**: May violate ToS by using undocumented API.  Include disclaimer. |
| **User Consent** | Clear ToS stating plugin uses unofficial methods |

### 7.5 Monitoring & Observability

| What | Tool | Alerts |
|------|------|--------|
| **Error Tracking** | Sentry | >5% error rate in 5 min |
| **Uptime Monitoring** | UptimeRobot | Downtime >1 minute |
| **API Latency** | CloudWatch | P95 >3 seconds |
| **Crawl Success Rate** | Custom Dashboard | <90% success rate |
| **Storage Costs** | AWS Cost Explorer | >$100/month |

---

## 8. User Interface Design

### 8.1 Settings Page Wireframe

```
┌────────────────────────────────────────────┐
│  Google Photos Shared Album for TRMNL     │
├────────────────────────────────────────────┤
│                                            │
│  Hello, John Doe!  👋                       │
│                                            │
│  Enter your Google Photos shared album    │
│  link below:                               │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ https://photos.app. goo.gl/ABC123     │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ℹ️ To get this link:                       │
│  1. Open Google Photos                    │
│  2. Select an album                       │
│  3. Tap Share → Create Link               │
│  4. Ensure link sharing is ON             │
│  5. Copy and paste here                   │
│                                            │
│  [ Save & Fetch Photos ]                  │
│                                            │
├────────────────────────────────────────────┤
│  Album Status:                             │
│  ✅ 47 photos found                        │
│  🕐 Last updated: 2 hours ago              │
│                                            │
│  [ Preview Photos ] [ Back to TRMNL ]     │
└────────────────────────────────────────────┘
```

### 8.2 Preview Page

```
┌────────────────────────────────────────────┐
│  Preview:  Your Google Photos               │
├────────────────────────────────────────────┤
│                                            │
│  Reload this page to see different photos │
│                                            │
│  [ ← Back to Settings ]  [ ↻ Refresh ]    │
│                                            │
│  Last Updated: Jan 18, 2026 10:30 UTC     │
│                                            │
├────────────────────────────────────────────┤
│  Full Size                                 │
│  ┌──────────────────────────────────────┐ │
│  │                                      │ │
│  │         [Sample Photo]               │ │
│  │                                      │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Half Vertical                             │
│  ┌─────────────────┐                      │
│  │ [Sample Photo]  │                      │
│  └─────────────────┘                      │
│                                            │
│  [Additional size previews...]             │
└────────────────────────────────────────────┘
```

### 8.3 Error States

**Invalid URL:**
```
❌ This doesn't look like a Google Photos shared album link. 

Expected format:
https://photos.app.goo.gl/ABC123
https://photos.google.com/share/ABC123

[ Try Again ]
```

**No Photos Found:**
```
⚠️ No photos found in this album.

This could mean:
• The album is empty
• The link sharing is turned off
• The album was deleted

[ Update Link ]
```

**Rate Limited:**
```
⏳ Too many requests. Please wait a moment and try again.

Your album will refresh automatically in a few minutes. 

[ Back to TRMNL ]
```

---

## 9. Implementation Phases

### Phase 1: Research & Proof of Concept (2 weeks)

**Goal:** Validate technical feasibility

**Tasks:**
- [ ] Analyze Google Photos shared album URLs (5+ different formats)
- [ ] Reverse engineer API endpoints using browser DevTools
- [ ] Build prototype script to fetch album metadata
- [ ] Test with 10+ different shared albums (various sizes, privacy settings)
- [ ] Document API request/response structure
- [ ] Assess ToS compliance risk with legal review

**Success Criteria:**
- Successfully fetch photo URLs from 90%+ of test albums
- Understand rate limits and restrictions
- Legal sign-off on ToS risk

**Risk Mitigation:**
- If API cannot be reverse-engineered, pivot to Option D (OAuth + Picker)

---

### Phase 2: Core Development (3 weeks)

**Goal:** Build MVP plugin

**Week 1: Backend**
- [ ] Set up DynamoDB schema
- [ ] Create album URL parser with regex validation
- [ ] Build album metadata fetcher (Google API integration)
- [ ] Implement S3 caching layer
- [ ] Add error handling and retry logic

**Week 2: Frontend & TRMNL Integration**
- [ ] Build settings page (Next.js route)
- [ ] Create preview page with all TRMNL sizes
- [ ] Implement `/markup` endpoint for TRMNL
- [ ] Add install/uninstall webhook handlers
- [ ] Server-side render HTML for e-ink display

**Week 3: Background Jobs & Polish**
- [ ] Set up Hatchet workflow for daily refresh
- [ ] Add monitoring and logging
- [ ] Write user-facing error messages
- [ ] Mobile-responsive UI
- [ ] Unit and integration tests (>70% coverage)

**Success Criteria:**
- Plugin functional end-to-end on staging environment
- All FR-P0 requirements implemented
- <5% error rate in testing

---

### Phase 3: Testing & Optimization (2 weeks)

**Goal:** Production readiness

**Week 1: Testing**
- [ ] Alpha testing with 10 internal users
- [ ] Load testing (simulate 1000 concurrent users)
- [ ] Edge case testing (empty albums, deleted albums, private albums)
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Mobile)
- [ ] TRMNL device testing (all screen sizes)

**Week 2: Optimization**
- [ ] Optimize image delivery (CDN, compression)
- [ ] Reduce API latency (<2s P95)
- [ ] Fix bugs from alpha testing
- [ ] Performance profiling and improvements
- [ ] Documentation (README, troubleshooting guide)

**Success Criteria:**
- 100% of alpha testers successfully set up plugin
- All P0 and P1 bugs resolved
- Performance targets met

---

### Phase 4: Beta Launch (2 weeks)

**Goal:** Limited public release

**Tasks:**
- [ ] Deploy to production (Vercel + Fly.io)
- [ ] Beta announcement to 100 opt-in users
- [ ] Set up support channel (Discord/GitHub Issues)
- [ ] Monitor error rates and user feedback
- [ ] Daily check-ins on metrics dashboard
- [ ] Iterate based on feedback

**Success Criteria:**
- 80%+ setup completion rate
- <3% error rate
- NPS >30
- No critical bugs

---

### Phase 5: General Availability (1 week)

**Goal:** Public launch

**Tasks:**
- [ ] Resolve beta feedback items
- [ ] Publish to TRMNL plugin marketplace
- [ ] Announcement blog post and social media
- [ ] Documentation and video tutorial
- [ ] Monitor for 7 days

**Success Criteria:**
- 500+ installs in first month
- 95%+ photo fetch success rate
- 99.5%+ uptime

---

## 10. Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Google ToS Violation** | High - Plugin shutdown, legal action | Medium | Include ToS disclaimer, monitor for cease-and-desist, have pivot plan to OAuth approach |
| **API Breaking Changes** | High - Plugin stops working | Medium | Monitor error rates, implement graceful degradation, maintain OAuth fallback |
| **Rate Limiting/IP Blocks** | Medium - Reduced functionality | Medium | Implement exponential backoff, rotate IPs, respect rate limits |
| **Shared Link Format Changes** | Medium - URL parsing breaks | Low | Support multiple formats, regex flexibility, version detection |
| **CDN Costs Exceed Budget** | Medium - Financial burden | Low | Set CloudWatch billing alarms, implement aggressive caching, compression |
| **Low Adoption** | Low - Wasted effort | Low | Pre-launch survey, beta feedback, market research |
| **GDPR Compliance Issues** | High - Legal liability | Very Low | Minimal data storage, clear privacy policy, data deletion on request |
| **Security Vulnerability** | High - User data breach | Low | Security audit, input validation, dependency scanning |

### Contingency Plan:  Pivot to OAuth

If reverse engineering fails or Google blocks the plugin:

**Week 1:**
- Switch to official Google Photos Picker API (existing code in repo)
- Implement OAuth flow
- Update UI to reflect new setup process

**Week 2:**
- Beta test with users
- Adjust marketing messaging ("secure, official integration")

**Trade-off:** Lose simplicity goal, but maintain functionality

---

## 11. Success Criteria & KPIs

### Launch Criteria (Must-Have)
- [ ] Plugin successfully fetches photos from 95%+ of valid shared album URLs
- [ ] Average setup time <3 minutes
- [ ] Zero critical bugs in production
- [ ] TRMNL marketplace approval obtained
- [ ] Legal review completed with acceptable risk level

### 30-Day Post-Launch KPIs

| KPI | Target | Actual | Status |
|-----|--------|--------|--------|
| Total Installs | 500 | _TBD_ | 🟡 |
| Active Users (30-day) | 300 | _TBD_ | 🟡 |
| Setup Completion Rate | 80% | _TBD_ | 🟡 |
| Average Setup Time | <3 min | _TBD_ | 🟡 |
| Photo Fetch Success Rate | 95% | _TBD_ | 🟡 |
| Error Rate | <5% | _TBD_ | 🟡 |
| Uptime | 99.5% | _TBD_ | 🟡 |
| User Satisfaction (NPS) | >40 | _TBD_ | 🟡 |
| Support Tickets | <20 | _TBD_ | 🟡 |

---

## 12. Dependencies & Assumptions

### Dependencies
- TRMNL platform API remains stable
- Next.js and Vercel deployment pipeline available
- AWS services (DynamoDB, S3) accessible
- Hatchet workflow engine operational

### Assumptions
1. **Google's shared album URLs are parseable** and contain accessible album IDs
2. **Google tolerates unofficial API usage** at low-moderate scale (like Apple currently does)
3. **TRMNL users want this feature** (validate with survey)
4. **Shared album links remain publicly accessible** without authentication
5. **Legal risk is acceptable** to TRMNL and plugin author

### Critical Path Items
1. Successfully reverse engineer Google Photos API (Week 1-2)
2. Obtain TRMNL marketplace approval (Week 7)
3. No legal cease-and-desist from Google (Ongoing)

---

## 13. Open Questions

| Question | Owner | Target Resolution |
|----------|-------|-------------------|
| What is acceptable legal risk for ToS violation? | Legal Team | Week 1 |
| Should we support Google Photos API OAuth as fallback? | Product Team | Week 2 |
| What pricing model (free vs. paid)? | Business Team | Week 3 |
| How do we handle DMCA takedown requests? | Legal Team | Week 4 |
| Should we proxy images or use direct Google URLs? | Engineering Team | Week 2 |
| What's the estimated monthly infrastructure cost at 1000 users? | Engineering Team | Week 3 |

---

## 14. Out of Scope (Future Consideration)

The following are explicitly **not** included in v1.0 but may be considered for future releases:

- **Video support** - Photos only initially
- **Multiple albums per user** - One album per installation
- **Photo filters** (date, person, location) - All photos in album displayed
- **Custom refresh schedules** - Fixed 24hr refresh
- **Photo ordering** (chronological, etc.) - Random only
- **Comments/captions display** - Metadata not shown
- **Offline mode** - Requires internet connection
- **Photo upload** - Read-only integration
- **Album creation** - External to Google Photos
- **Analytics dashboard** - Basic metrics only

---

## 15. Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **TRMNL** | E-ink display device for displaying web content |
| **Shared Album URL** | Public link to Google Photos album (e.g., photos.app.goo.gl/ABC) |
| **Markup** | HTML content rendered on TRMNL device |
| **OAuth** | Open Authorization standard for API access |
| **Crawl** | Background process to fetch album metadata |
| **E-ink** | Electronic paper display technology used by TRMNL |
| **Render** | Generate and display photo on TRMNL screen |

### B. Reference Links

- [TRMNL Plugin Documentation](https://usetrmnl.com/docs/plugins)
- [Google Photos Sharing Help](https://support.google.com/photos/answer/6131416)
- [Existing Apple Photos Plugin Code](https://github.com/zegl/trmnl-apple-photos)
- [Google Photos ToS](https://policies.google.com/terms)

### C. Related PRDs
- TRMNL Apple Photos Plugin (Implemented)
- TRMNL Google Photos OAuth Plugin (Partially Implemented)

---

## Document Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | _TBD_ | | |
| Engineering Lead | _TBD_ | | |
| Legal Counsel | _TBD_ | | |
| UX Designer | _TBD_ | | |

---

**End of PRD**

*This is a living document and will be updated as requirements evolve.*