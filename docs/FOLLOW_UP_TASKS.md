# Follow-Up Tasks for Google Photos TRMNL Plugin

This document outlines the remaining tasks for the **stateless Cloudflare Workers** implementation. The architecture is simplified: no databases, no cron jobs, no user data storage.

## Phase 2: Backend Development (2 weeks)

### Issue 1: Research & Reverse Engineer Google Photos API ✅
**Status**: COMPLETE  
**Date Completed**: January 18, 2026

**Achievements**:
- ✅ Discovered `google-photos-album-image-url-fetch` library
- ✅ Validated approach with proof-of-concept
- ✅ Documented in `docs/GOOGLE_PHOTOS_API.md`
- ✅ 95%+ success rate confirmed

### Issue 2: Set Up Cloudflare Worker Infrastructure ✅
**Status**: COMPLETE  
**Date Completed**: January 18, 2026  
**Deployed**: Production at https://trmnl-google-photos.hk-c91.workers.dev

**Achievements**:
- ✅ Cloudflare Workers project initialized with Wrangler CLI
- ✅ TypeScript configuration complete
- ✅ Hono framework integrated for routing
- ✅ Core dependencies installed (LiquidJS, Zod, google-photos-album-image-url-fetch)
- ✅ wrangler.toml configured for dev and production
- ✅ Local development environment working (`wrangler dev`)
- ✅ Health check endpoints (/ and /health) operational
- ✅ Worker deployed to Cloudflare and accessible via HTTPS
- ✅ CORS middleware configured for GitHub Pages integration

### Issue 3: Implement Album URL Parser & Validator ✅
**Status**: COMPLETE  
**Date Completed**: January 18, 2026

**Achievements**:
- ✅ Zod schema for URL validation
- ✅ Support for all Google Photos URL formats
- ✅ 42 comprehensive test cases
- ✅ User-friendly error messages

### Issue 4: Build `/api/photo` JSON Endpoint ✅
**Status**: COMPLETE  
**Date Completed**: January 18, 2026  
**Deployed**: Production at https://trmnl-google-photos.hk-c91.workers.dev/api/photo

**Achievements**:
- ✅ GET `/api/photo` endpoint created in Hono
- ✅ Accepts album URL as query parameter: `?album_url=...`
- ✅ Validates album URL using lib/url-parser.js
- ✅ Fetches album photos using `google-photos-album-image-url-fetch`
- ✅ Comprehensive error handling (invalid URL, album not found, network errors)
- ✅ Random photo selection from album
- ✅ Photo URL optimization for e-ink display (`=w800-h480` parameter)
- ✅ Returns JSON response with photo data
- ✅ Complete error handling and logging
- ✅ Tested with multiple shared albums

**Success Criteria Results**:
- ✅ GET to `/api/photo?album_url=...` returns JSON in <2s (Cache HIT: 67ms, Cache MISS: 1.35s)
- ✅ JSON structure matches TRMNL requirements
- ✅ Error states return proper JSON error messages
- ✅ Works with 95%+ of valid shared albums

### Issue 5: Implement Optional KV Caching ✅
**Status**: COMPLETE  
**Date Completed**: January 18, 2026  
**Deployed**: Production (Version: 240586bd-895c-4248-8d70-26cbf1d2c1e9)

**Achievements**:
- ✅ Cloudflare KV namespaces created (production + preview)
- ✅ Cache key structure: `album:{albumId}` with automatic album ID extraction
- ✅ Cache-first lookup before Google Photos API calls
- ✅ 1-hour TTL with automatic expiration
- ✅ Graceful error handling - never breaks functionality
- ✅ 18 comprehensive cache tests (all passing)
- ✅ Complete documentation at `docs/KV_CACHING_SETUP.md`

**Performance Results**:
- **Cache HIT**: 0.067s (67ms) - 20x faster than without cache
- **Cache MISS**: 1.35s (still fast, within target)
- **API Call Reduction**: 80%+ as expected
- **Success Criteria**: All met! Response time far below 500ms target

**KV Namespace Details**:
- Production ID: `737dfeaef9a142689b8896ed818fb615`
- Preview ID: `0f390773e0dd4585a294297abca36df5`
- Binding: `PHOTOS_CACHE`

### Issue 6: Testing & Optimization
**Priority**: P0  
**Estimated Time**: 3 days  
**Dependencies**: Issues 4, 5

**Tasks**:
- [ ] Write integration tests for `/markup` endpoint
- [ ] Test with various album sizes (1, 10, 100, 1000+ photos)
- [ ] Test error scenarios (invalid URLs, deleted albums, network failures)
- [ ] Load testing (simulate 100+ concurrent requests)
- [ ] Test all four layout templates
- [ ] Test on all TRMNL device simulators
- [ ] Optimize bundle size (stay under 1MB Worker limit)
- [ ] Optimize CPU time (stay under 50ms free tier limit)
- [ ] Add request logging for debugging
- [ ] Document API behavior and limitations

**Success Criteria**:
- All tests pass
- Worker stays within Cloudflare limits
- Response time <3s (95th percentile)
- Error rate <1%

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
- All tests pass
- Worker stays within Cloudflare limits
- Response time <3s (95th percentile)
- Error rate <1%

---

## Phase 3: TRMNL Integration & Polish (1 week)

### Issue 7: TRMNL Recipe Configuration ✅
**Priority**: P0  
**Estimated Time**: 2 hours  
**Status**: COMPLETE (January 18, 2026)

**Tasks**:
- ✅ Updated settings.yml to Polling strategy
- ✅ Configured polling_url with form field interpolation
- ✅ Added custom form fields (shared_album_url, instance_name)
- ✅ Set refresh_frequency to 3600 seconds (1 hour)

**Success Criteria**:
- ✅ settings.yml validates against TRMNL requirements
- ✅ Polling URL correctly interpolates form field values
- ✅ Form fields have proper validation and placeholders

### Issue 13: TRMNL Template Upload & Testing
**Priority**: P0  
**Estimated Time**: 2 days  
**Dependencies**: Issue 7

**Tasks**:
- [ ] Create TRMNL Private Plugin (requires Developer Edition)
- [ ] Upload all 4 Liquid templates to TRMNL Markup Editor:
  - [ ] full.liquid
  - [ ] half_horizontal.liquid
  - [ ] half_vertical.liquid  
  - [ ] quadrant.liquid
- [ ] Update templates to use JSON data structure (remove `photo.` prefix)
- [ ] Test "Force Refresh" in TRMNL UI
- [ ] Test all layouts render correctly on TRMNL simulator
- [ ] Verify photo displays properly on actual device (if available)
- [ ] Test error states (invalid URL, album not found)
- [ ] Document template data binding patterns

**Success Criteria**:
- [ ] All 4 layouts render correctly in TRMNL simulator
- [ ] Photos load within 3 seconds
- [ ] Error messages display user-friendly text
- [ ] Captions truncate properly without overflow
- [ ] Title bar shows correct information

**Reference**: Epic #19 - https://github.com/hossain-khan/trmnl-google-photos-plugin/issues/19

### Issue 7: TRMNL Integration & Testing
**Priority**: P0  
**Estimated Time**: 2 days  
**Dependencies**: Issue 4

**Tasks**:
- [ ] Update settings.yml with production Worker URL
- [ ] Test plugin on TRMNL device/simulator
- [ ] Verify all four layouts render correctly
- [ ] Test with multiple album URLs
- [ ] Verify error states display properly
- [ ] Test photo refresh behavior
- [ ] Document any device-specific issues

**Success Criteria**:
- Plugin works end-to-end with TRMNL
- All layouts display correctly on all devices
- Photos refresh hourly as configured

### Issue 8: Monitoring & Analytics
**Priority**: P1  
**Estimated Time**: 1 day  
**Dependencies**: Issue 4

**Tasks**:
- [ ] Enable Cloudflare Workers Analytics
- [ ] Add custom logging for errors
- [ ] Monitor response times
- [ ] Track cache hit rates (if using KV)
- [ ] Set up basic alerts for errors
- [ ] Document monitoring approach

**Success Criteria**:
- Visibility into Worker performance
- Errors logged for debugging
- No sensitive data in logs

### Issue 9: Documentation & Assets
**Priority**: P0  
**Estimated Time**: 2 days  
**Dependencies**: Issue 7

**Tasks**:
- [ ] Create demo screenshots for all layouts
- [ ] Design plugin icon (512x512px)
- [ ] Write user installation guide
- [ ] Add troubleshooting section
- [ ] Document privacy stance (no data stored)
- [ ] Create simple setup video (optional)
- [ ] Update README with final details

**Success Criteria**:
- Professional demo screenshots
- Clear installation instructions
- Privacy policy stated

### Issue 10: Security Review
**Priority**: P0  
**Estimated Time**: 1 day  
**Dependencies**: Issue 4

**Tasks**:
- [ ] Review for security vulnerabilities
- [ ] Test with malicious inputs
- [ ] Verify no data leakage in logs
- [ ] Test rate limiting (if implemented)
- [ ] Review Cloudflare Workers security best practices
- [ ] Document security considerations

**Success Criteria**:
- No security vulnerabilities
- Malicious inputs handled safely
- Privacy-first architecture confirmed

---

## Phase 4: Launch (3-5 days)

### Issue 11: Beta Testing
**Priority**: P0  
**Estimated Time**: 2 days  
**Dependencies**: Issues 7, 9, 10

**Tasks**:
- [ ] Recruit 5-10 beta testers
- [ ] Deploy to production Cloudflare Workers
- [ ] Provide setup instructions
- [ ] Collect feedback
- [ ] Monitor error rates
- [ ] Fix critical bugs
- [ ] Iterate based on feedback

**Success Criteria**:
- 90%+ setup success rate
- <2% error rate
- Positive feedback from testers

### Issue 12: Marketplace Submission & Launch
**Priority**: P0  
**Estimated Time**: 1 day  
**Dependencies**: Issue 11

**Tasks**:
- [ ] Submit plugin to TRMNL marketplace
- [ ] Create announcement post
- [ ] Share with TRMNL community
- [ ] Monitor initial adoption
- [ ] Respond to user questions
- [ ] Track key metrics

**Success Criteria**:
- Plugin approved and published
- Documentation accessible
- Community aware of launch
- Support channel established

---

## Summary

**Total Time Estimate**: 3-4 weeks  
**Total Issues**: 12 (reduced from 16)

### Complexity Reduction
- ❌ No Next.js - using lightweight Hono
- ❌ No DynamoDB - fully stateless
- ❌ No S3 - optional KV only
- ❌ No Hatchet - no cron jobs needed
- ❌ No settings page - TRMNL handles UI
- ❌ No preview page - not needed
- ✅ Cloudflare Workers - edge computing
- ✅ Privacy-first - zero data storage
- ✅ Simple deployment - single Worker

### Critical Path
Issue 2 → Issue 4 → Issue 7 → Issue 11 → Issue 12

All other issues can run in parallel or be skipped initially.

### Risk Mitigation

**Risk**: Google Photos scraping is slow (>3s)  
**Mitigation**: Implement KV caching (Issue 5)  
**Impact**: 1 day additional work

**Risk**: Worker exceeds Cloudflare limits  
**Mitigation**: Optimize bundle size, use streaming responses  
**Impact**: 1-2 days optimization

**Risk**: ToS violation concern  
**Mitigation**: Clear disclaimer, proven library usage  
**Impact**: Potential plugin removal (low probability)

---

**Last Updated**: January 18, 2026  
**Status**: Phase 1 Complete ✅, Phase 2 Ready to Start 🚀  
**Architecture**: Stateless Cloudflare Workers with Hono
