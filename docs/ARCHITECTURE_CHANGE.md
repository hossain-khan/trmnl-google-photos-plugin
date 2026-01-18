# Architecture Change: Webhook → Polling Strategy

**Date**: January 18, 2026  
**Impact**: Major architectural simplification  
**Status**: Documentation updated, Worker needs refactoring

---

## Summary

After researching TRMNL's plugin system more thoroughly, we discovered a critical misunderstanding:

**OLD (Incorrect) Architecture**:
- Worker renders HTML using LiquidJS
- Webhook strategy (POST /markup)
- Worker returns complete HTML to TRMNL
- Templates bundled with Worker

**NEW (Correct) Architecture**:
- Worker returns JSON data only
- Polling strategy (GET /api/photo)
- TRMNL renders templates on their platform
- Templates stored in TRMNL Markup Editor

---

## Why This Change Matters

### Benefits

1. **Simpler Worker**
   - No template rendering logic
   - Smaller bundle size (<50KB vs ~100KB)
   - Faster responses (JSON serialization vs HTML rendering)
   - Remove LiquidJS dependency entirely

2. **Better TRMNL Integration**
   - Standard Polling pattern (most common for TRMNL plugins)
   - Templates can be updated in TRMNL without Worker changes
   - Follows TRMNL's documented best practices
   - Easier for users to customize

3. **Reusable API**
   - Same JSON endpoint for TRMNL and GitHub Pages demo
   - Standard REST API pattern
   - Better caching (GET requests)
   - Easier to test and debug

### Trade-offs

- ✅ No real downsides - this is simply the correct approach
- ✅ Less complexity overall
- ✅ Better separation of concerns (data vs presentation)

---

## What Changed

### Worker Endpoints

**Before**:
```
POST /markup
Body: { plugin_settings: { shared_album_url: "..." }, layout: "full" }
Response: HTML (rendered Liquid template)
```

**After**:
```
GET /api/photo?album_url=https://photos.app.goo.gl/ABC123
Response: JSON { photo_url, caption, album_name, photo_count, timestamp }
```

### settings.yml

**Before**:
```yaml
strategy: webhook
markup_webhook_url: https://trmnl-google-photos.gohk.xyz/markup
private_variables:
  - name: shared_album_url
    type: string
```

**After**:
```yaml
strategy: polling
polling_url: https://trmnl-google-photos.gohk.xyz/api/photo?album_url={{ shared_album_url }}
polling_verb: GET
form_fields:
  - name: shared_album_url
    type: text
    required: true
```

### Template Data Access

**Before** (Worker-rendered):
```liquid
<!-- Worker passed nested object -->
{{ photo.photo_url }}
{{ photo.caption }}
{{ trmnl.plugin_settings.shared_album_url }}
```

**After** (TRMNL-rendered):
```liquid
<!-- TRMNL merges flat JSON -->
{{ photo_url }}
{{ caption }}
{{ trmnl.plugin_settings.shared_album_url }}  <!-- Still available -->
```

### Template Location

**Before**: 
- Templates in `templates/` directory
- Loaded by Worker
- Rendered server-side with LiquidJS

**After**:
- Templates uploaded to TRMNL Markup Editor
- Rendered by TRMNL platform
- Worker only provides JSON data

---

## Implementation Status

### ✅ Completed

- [x] Updated ARCHITECTURE.md with correct flow diagrams
- [x] Updated settings.yml to Polling strategy
- [x] Updated FOLLOW_UP_TASKS.md with correct Issue descriptions
- [x] Updated copilot-instructions.md throughout
- [x] Documented architectural change

### ⏳ TODO - Worker Refactoring

**Current Worker** (src/index.ts):
```typescript
// ❌ Current: POST /markup with LiquidJS rendering
app.post('/markup', async (c) => {
  // Extract album URL from body
  // Fetch photos
  // Render Liquid template
  // Return HTML
});
```

**Needed Changes**:
```typescript
// ✅ New: GET /api/photo returning JSON
app.get('/api/photo', async (c) => {
  const albumUrl = c.req.query('album_url');
  // Validate URL
  // Fetch photos (with KV cache)
  // Select random photo
  // Return JSON: { photo_url, caption, album_name, photo_count, timestamp }
});
```

**File Changes Required**:
1. **src/index.ts**:
   - Change POST /markup to GET /api/photo
   - Remove Liquid template loading
   - Remove LiquidJS imports
   - Return JSON instead of HTML
   - Handle album_url from query parameter

2. **Remove files**:
   - Can optionally remove templates from repo (uploaded to TRMNL instead)
   - Or keep for documentation/reference

3. **Update tests**:
   - Test JSON response structure
   - Remove HTML rendering tests
   - Add tests for query parameter parsing

4. **package.json**:
   - Remove liquidjs dependency
   - Update to smaller bundle

---

## GitHub Issues Status

### Epic #19: Phase 3 TRMNL Integration

**Issue #13 - TRMNL Integration & Testing** (NEW SCOPE):
- [ ] Create Private Plugin in TRMNL
- [ ] Upload 4 Liquid templates to Markup Editor
- [ ] Update templates to use flat JSON structure (no `photo.` prefix)
- [ ] Test with "Force Refresh" in TRMNL UI
- [ ] Verify rendering on TRMNL simulator/device
- [ ] Document template data binding patterns

**Issue #14 - Monitoring & Analytics** (NO CHANGE):
- [ ] Enable Cloudflare Workers Analytics
- [ ] Add custom error logging
- [ ] Monitor response times and cache hit rates

**Issue #15 - Documentation & Assets** (UPDATE):
- [ ] Create demo screenshots (need TRMNL device/simulator)
- [ ] Design plugin icon (512x512px)
- [ ] Write user installation guide
- [ ] ~~Document template rendering~~ → Document JSON API structure
- [ ] Privacy policy (no changes needed - still stateless)

**Issue #16 - Security Review** (UPDATE):
- [ ] Review code for security vulnerabilities
- [ ] Test with malicious album URL inputs (XSS in captions, etc.)
- [ ] Verify no sensitive data in logs
- [ ] ~~Review HTML sanitization~~ → Review JSON sanitization
- [ ] Document security considerations

---

## Next Steps

### Immediate (Today/Tomorrow)

1. **Refactor Worker** (2-3 hours):
   - Implement GET /api/photo endpoint
   - Remove POST /markup endpoint
   - Remove LiquidJS dependency
   - Update tests
   - Deploy to production

2. **Update Templates** (1 hour):
   - Change `{{ photo.photo_url }}` to `{{ photo_url }}`
   - Change `{{ photo.caption }}` to `{{ caption }}`
   - Test locally with data.json

3. **Test End-to-End**:
   - Call GET /api/photo?album_url=... manually
   - Verify JSON response structure
   - Confirm all fields present

### This Week

4. **TRMNL Integration** (Issue #13):
   - Create Private Plugin
   - Upload templates
   - Test on TRMNL
   - Iterate on layouts

5. **Publish Recipe**:
   - Choose Unlisted (instant) or Public (moderated)
   - Submit to TRMNL
   - Share with community

---

## Documentation Updates

All documentation has been updated to reflect the new architecture:

- ✅ `docs/ARCHITECTURE.md` - Complete rewrite of flow diagrams
- ✅ `docs/FOLLOW_UP_TASKS.md` - Updated Issue #4 and Phase 3
- ✅ `.github/copilot-instructions.md` - Updated throughout
- ✅ `settings.yml` - Changed to Polling strategy
- ✅ `docs/ARCHITECTURE_CHANGE.md` - This document

**No changes needed**:
- `docs/URL_PARSER.md` - Still valid (URL parsing unchanged)
- `docs/GOOGLE_PHOTOS_API.md` - Still valid (photo fetching unchanged)
- `docs/KV_CACHING_SETUP.md` - Still valid (caching unchanged)
- `README.md` - Already accurate (describes overall architecture correctly)

---

## Key Learnings

1. **Always read platform documentation carefully** - We missed that TRMNL has a Polling strategy and Markup Editor
2. **Templates belong with the platform** - TRMNL users expect to customize templates in the Markup Editor
3. **Workers should serve data, not UI** - JSON APIs are more flexible and reusable
4. **Simpler is better** - Removing LiquidJS makes the Worker faster and easier to maintain

---

## Questions & Answers

**Q: Can we still use the same Worker for GitHub Pages demo?**  
A: Yes! The demo will fetch JSON from `/api/photo` and render client-side.

**Q: Do we lose any functionality with this change?**  
A: No - we actually gain flexibility. Templates can be updated without deploying the Worker.

**Q: What about the existing /markup endpoint?**  
A: We'll remove it entirely. It was based on a misunderstanding of TRMNL's architecture.

**Q: Will this break anything in production?**  
A: Currently nothing is using the Worker in production yet, so safe to refactor.

**Q: Should we keep templates in the repo?**  
A: Yes, for documentation and Recipe publishing. But they won't be used by the Worker.

---

**Next Action**: Refactor Worker to implement GET /api/photo endpoint (Issue #4 revision)
