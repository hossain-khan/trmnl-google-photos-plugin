# Follow-Up Tasks for Google Photos TRMNL Plugin

This document outlines the remaining tasks that should be completed in subsequent development phases. Each phase can be broken down into separate GitHub issues for better tracking.

## Phase 2: Backend Development (3 weeks)

### Issue 1: Research & Reverse Engineer Google Photos API
**Priority**: P0 - Blocking for all other work  
**Estimated Time**: 1 week  
**Dependencies**: None

**Tasks**:
- [ ] Collect 10+ Google Photos shared album URLs with different formats
- [ ] Use Chrome DevTools to analyze network requests when viewing shared albums
- [ ] Identify undocumented API endpoints used by Google Photos web app
- [ ] Document request format (headers, parameters, authentication)
- [ ] Document response format (JSON structure, photo URLs)
- [ ] Create proof-of-concept Node.js script to fetch album data
- [ ] Test with various album sizes (1, 10, 100, 1000+ photos)
- [ ] Test with different privacy settings (public, link-only)
- [ ] Identify rate limits and restrictions
- [ ] Legal review of ToS compliance risk

**Success Criteria**:
- Successfully fetch photo URLs from 90%+ of test albums
- Understand API structure well enough to implement production code
- Document findings in `docs/GOOGLE_PHOTOS_API.md`

### Issue 2: Set Up Next.js Backend Infrastructure
**Priority**: P0  
**Estimated Time**: 3 days  
**Dependencies**: None

**Tasks**:
- [ ] Initialize Next.js 15 project with App Router
- [ ] Set up TypeScript configuration
- [ ] Install core dependencies (Zod, AWS SDK, etc.)
- [ ] Configure environment variables (.env.example)
- [ ] Set up AWS DynamoDB table with schema
- [ ] Set up AWS S3 bucket for album metadata caching
- [ ] Configure Vercel deployment
- [ ] Set up local development environment
- [ ] Add basic health check endpoint
- [ ] Configure CORS for TRMNL domains

**Success Criteria**:
- Next.js app runs locally and deploys to Vercel
- DynamoDB and S3 accessible from application
- Environment properly configured for dev/staging/prod

### Issue 3: Implement Album URL Parser & Validator
**Priority**: P0  
**Estimated Time**: 2 days  
**Dependencies**: Issue 1

**Tasks**:
- [ ] Create Zod schema for shared album URL validation
- [ ] Implement regex patterns for all URL formats
- [ ] Extract album ID from various URL formats
- [ ] Add unit tests for URL parser (20+ test cases)
- [ ] Handle edge cases (malformed URLs, non-Google domains)
- [ ] Provide user-friendly error messages
- [ ] Document supported URL formats

**Success Criteria**:
- Parse 100% of valid Google Photos shared album URLs
- Reject invalid URLs with clear error messages
- All tests pass

### Issue 4: Build Album Metadata Fetcher Service
**Priority**: P0  
**Estimated Time**: 5 days  
**Dependencies**: Issues 1, 2

**Tasks**:
- [ ] Implement HTTP client for Google Photos API
- [ ] Add request headers and user-agent spoofing (if needed)
- [ ] Parse API response and extract photo metadata
- [ ] Handle pagination for large albums
- [ ] Filter out videos (photos only)
- [ ] Implement error handling (network errors, invalid albums, etc.)
- [ ] Add retry logic with exponential backoff
- [ ] Respect rate limits
- [ ] Add integration tests with real albums
- [ ] Mock API responses for unit tests

**Success Criteria**:
- Fetch metadata from albums with 1-10,000 photos
- Handle errors gracefully
- Respect rate limits
- 90%+ success rate in testing

### Issue 5: Implement S3 Caching Layer
**Priority**: P1  
**Estimated Time**: 2 days  
**Dependencies**: Issues 2, 4

**Tasks**:
- [ ] Design S3 object key structure (e.g., `users/{uuid}/album-{id}.json`)
- [ ] Implement cache write function
- [ ] Implement cache read function
- [ ] Add TTL check (24 hours)
- [ ] Handle cache misses gracefully
- [ ] Add cache invalidation logic
- [ ] Implement compression for large metadata
- [ ] Add unit tests for cache operations

**Success Criteria**:
- Album metadata cached for 24 hours
- Cache hits reduce API calls by 90%+
- Handle cache failures gracefully (fallback to fresh fetch)

### Issue 6: Build Settings Page UI
**Priority**: P0  
**Estimated Time**: 4 days  
**Dependencies**: Issues 2, 3

**Tasks**:
- [ ] Create `/google-shared/settings` route in Next.js
- [ ] Build form for pasting album URL
- [ ] Add real-time URL validation feedback
- [ ] Display album status (photo count, last updated)
- [ ] Show error messages for invalid URLs
- [ ] Add "Save & Fetch Photos" button
- [ ] Create mobile-responsive layout
- [ ] Add loading states during save
- [ ] Implement success confirmation
- [ ] Add "Back to TRMNL" button

**Success Criteria**:
- Users can paste URL and see immediate validation
- Form submits successfully and triggers album fetch
- Works on mobile and desktop browsers
- Matches wireframes in PRD

### Issue 7: Build Preview Page
**Priority**: P1  
**Estimated Time**: 3 days  
**Dependencies**: Issues 4, 5, 6

**Tasks**:
- [ ] Create `/google-shared/preview` route
- [ ] Fetch album metadata from cache/API
- [ ] Select random photo for display
- [ ] Render all four layout previews (full, half_horizontal, half_vertical, quadrant)
- [ ] Add "Refresh" button to see different photo
- [ ] Display last updated timestamp
- [ ] Show photo count
- [ ] Add mobile-responsive design
- [ ] Handle error states (no photos, invalid album)

**Success Criteria**:
- Preview shows random photos from user's album
- All four layouts render correctly
- Users can refresh to see different photos

---

## Phase 3: TRMNL Integration (2 weeks)

### Issue 8: Implement /markup Endpoint
**Priority**: P0  
**Estimated Time**: 3 days  
**Dependencies**: Issues 4, 5

**Tasks**:
- [ ] Create `/google-shared/markup` POST endpoint
- [ ] Parse TRMNL request (user UUID, layout size)
- [ ] Fetch album metadata from cache
- [ ] Select random photo using weighted algorithm
- [ ] Render Liquid template server-side
- [ ] Optimize image URL for e-ink (resolution, format)
- [ ] Add error handling for unconfigured users
- [ ] Track render count and timestamp
- [ ] Add response caching (5 minutes)
- [ ] Log metrics to CloudWatch

**Success Criteria**:
- Endpoint responds in <1s (P99)
- Returns valid HTML for TRMNL rendering
- Different photo on each request (random selection)
- Works for all four layout sizes

### Issue 9: Implement Webhook Handlers
**Priority**: P0  
**Estimated Time**: 2 days  
**Dependencies**: Issue 2

**Tasks**:
- [ ] Create `/google-shared/webhook/install` POST endpoint
- [ ] Store user data in DynamoDB on installation
- [ ] Create `/google-shared/webhook/uninstall` POST endpoint
- [ ] Delete user data from DynamoDB on uninstallation
- [ ] Delete cached metadata from S3
- [ ] Add webhook signature verification
- [ ] Handle duplicate install/uninstall events
- [ ] Add logging and monitoring
- [ ] Test with TRMNL platform

**Success Criteria**:
- User data created on install
- User data deleted within 30 days of uninstall (GDPR)
- All webhooks handled successfully

### Issue 10: Set Up Background Refresh Jobs
**Priority**: P1  
**Estimated Time**: 4 days  
**Dependencies**: Issues 4, 5

**Tasks**:
- [ ] Set up Hatchet workflow engine (or cron alternative)
- [ ] Create `refresh-all-albums-cron` job (daily 00:00 UTC)
- [ ] Query all active users from DynamoDB
- [ ] For each user, refresh album metadata
- [ ] Update S3 cache with fresh data
- [ ] Handle errors gracefully (skip failed albums)
- [ ] Send alerts for repeated failures
- [ ] Add job monitoring dashboard
- [ ] Create `refresh-single-album` on-demand job
- [ ] Test job execution and error handling

**Success Criteria**:
- All albums refreshed daily
- <5% failure rate
- Failed albums retried next day
- Monitoring alerts for issues

### Issue 11: Add Monitoring & Error Tracking
**Priority**: P1  
**Estimated Time**: 2 days  
**Dependencies**: All previous issues

**Tasks**:
- [ ] Set up Sentry for error tracking
- [ ] Add Sentry to all API routes
- [ ] Configure CloudWatch logs
- [ ] Create CloudWatch dashboard with key metrics
- [ ] Add alarms for error rate >5%
- [ ] Add alarms for API latency P95 >3s
- [ ] Add alarms for background job failures
- [ ] Set up UptimeRobot for uptime monitoring
- [ ] Configure alert notifications (email/Slack)
- [ ] Document monitoring setup in README

**Success Criteria**:
- All errors captured in Sentry
- CloudWatch dashboard shows key metrics
- Alerts fire for critical issues
- 99.5%+ uptime tracked

---

## Phase 4: Testing & Launch (2 weeks)

### Issue 12: Alpha Testing with Internal Users
**Priority**: P0  
**Estimated Time**: 1 week  
**Dependencies**: Issues 8, 9, 10

**Tasks**:
- [ ] Recruit 10 internal alpha testers
- [ ] Create testing guide with setup instructions
- [ ] Deploy to staging environment
- [ ] Testers install plugin and configure albums
- [ ] Collect feedback via survey
- [ ] Monitor for errors and issues
- [ ] Track key metrics (setup completion rate, error rate)
- [ ] Create bug tracking spreadsheet
- [ ] Prioritize and fix critical bugs
- [ ] Document common issues in troubleshooting guide

**Success Criteria**:
- 80%+ setup completion rate
- <5% error rate
- 8/10 testers rate experience 4+ stars
- All P0 bugs fixed

### Issue 13: Security Audit & CodeQL
**Priority**: P0  
**Estimated Time**: 3 days  
**Dependencies**: All Phase 3 issues

**Tasks**:
- [ ] Run GitHub CodeQL scanner
- [ ] Fix all critical and high-severity issues
- [ ] Review input validation (XSS, SQL injection, etc.)
- [ ] Review authentication and authorization
- [ ] Check for secret exposure (API keys, tokens)
- [ ] Review CORS configuration
- [ ] Test rate limiting
- [ ] Review data encryption (at rest and in transit)
- [ ] Check GDPR compliance (data deletion, retention)
- [ ] Document security measures in README

**Success Criteria**:
- Zero critical/high security vulnerabilities
- GDPR compliant
- All sensitive data encrypted
- Rate limiting enforced

### Issue 14: Load & Performance Testing
**Priority**: P1  
**Estimated Time**: 2 days  
**Dependencies**: All Phase 3 issues

**Tasks**:
- [ ] Set up load testing tool (k6, Artillery, etc.)
- [ ] Create test scenarios (1x, 10x, 100x normal load)
- [ ] Test /markup endpoint with 1000 concurrent users
- [ ] Test background job with 100 albums
- [ ] Measure P50, P95, P99 latency
- [ ] Identify bottlenecks
- [ ] Optimize slow endpoints
- [ ] Add caching where needed
- [ ] Retest after optimizations
- [ ] Document performance benchmarks

**Success Criteria**:
- P95 latency <2s for /markup endpoint
- Support 1000+ concurrent users
- No errors under normal load

### Issue 15: Beta Launch & Marketplace Submission
**Priority**: P0  
**Estimated Time**: 1 week  
**Dependencies**: Issues 12, 13, 14

**Tasks**:
- [ ] Deploy to production
- [ ] Create private TRMNL plugin
- [ ] Test plugin on actual TRMNL devices (all sizes)
- [ ] Create demo screenshots for all layouts
- [ ] Design plugin icon (512x512px)
- [ ] Write user documentation
- [ ] Create video tutorial (optional)
- [ ] Beta launch to 100 opt-in users
- [ ] Monitor for 48 hours
- [ ] Gather feedback via survey
- [ ] Fix critical bugs from beta
- [ ] Submit plugin to TRMNL marketplace
- [ ] Await TRMNL team approval
- [ ] Publish announcement

**Success Criteria**:
- Plugin approved by TRMNL marketplace
- 500+ installs in first month
- >80% setup completion rate
- NPS >40
- 99.5%+ uptime

---

## Issue Breakdown Summary

**Phase 2 (7 issues)**: Backend infrastructure and core functionality  
**Phase 3 (4 issues)**: TRMNL integration and automation  
**Phase 4 (4 issues)**: Testing, security, and launch  

**Total**: 15 major issues spanning ~7 weeks of development

## Critical Path

The following issues are on the critical path and must be completed sequentially:

1. Issue 1 → Issue 4 → Issue 8 → Issue 12 → Issue 15

All other issues can be parallelized or have flexible dependencies.

## Risk Mitigation

**Risk**: Google Photos API cannot be reverse engineered (Issue 1)  
**Mitigation**: Pivot to OAuth approach (use official Google Photos API)  
**Impact**: 2-week delay, requires UX redesign

**Risk**: ToS violation leads to cease-and-desist (Phase 4)  
**Mitigation**: Include ToS disclaimer, have OAuth fallback ready  
**Impact**: Plugin shutdown, user migration to OAuth version

**Risk**: Load testing reveals performance issues (Issue 14)  
**Mitigation**: Start load testing earlier (after Issue 8)  
**Impact**: 1-week delay for optimization

## Next Steps

1. Create GitHub issues from this document (one per section)
2. Assign priorities (P0 = must-have, P1 = should-have, P2 = nice-to-have)
3. Assign to team members
4. Set up project board for tracking
5. Begin work on Issue 1 (Research & Reverse Engineer API)

---

**Last Updated**: January 18, 2026  
**Status**: Phase 1 Complete ✅, Phase 2 Planning
