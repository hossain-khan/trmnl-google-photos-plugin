# Security Policy

## Overview

The TRMNL Google Photos Plugin is designed with **security-first** principles. This document outlines the security measures, threat model, and vulnerability reporting process.

## Security Architecture

### Key Security Principles

1. **Zero User Data Storage**: Plugin is completely stateless - no databases, no user credentials, no album URLs stored
2. **Input Validation**: All inputs validated with strict whitelist and length limits
3. **Output Sanitization**: All JSON responses validated before sending to clients
4. **Defense in Depth**: Multiple layers of security validation
5. **Privacy by Design**: No PII collected or logged

## Threat Model

### In-Scope Threats

- **XSS Attacks**: Malicious scripts in JSON responses
- **URL Injection**: Malicious URLs in album parameters
- **DoS Attacks**: Resource exhaustion via large inputs
- **Data Leakage**: Sensitive information in logs or errors
- **JSON Injection**: Breaking JSON structure with special characters
- **Photo URL Manipulation**: Non-Google Photos URLs in responses

### Out-of-Scope

- Google Photos API vulnerabilities (third-party service)
- TRMNL platform vulnerabilities (separate system)
- Client-side rendering issues (handled by TRMNL)

## Security Measures

### 1. Input Validation

#### Album URL Validation (lib/url-parser.ts)

```typescript
// Whitelist only Google Photos domains
✅ photos.app.goo.gl (short URLs)
✅ photos.google.com (full URLs)
❌ All other domains rejected

// Length limits (DoS prevention)
✅ Max URL length: 2048 characters
✅ Max album ID length: 200 characters

// Protocol enforcement
✅ HTTPS only
❌ HTTP rejected
❌ javascript: URIs rejected
❌ data: URIs rejected

// Special character filtering
✅ Alphanumeric, hyphens, underscores allowed
❌ Null bytes rejected
❌ Control characters rejected
❌ Unicode/emoji rejected
```

**Test Coverage**: 42 URL parser tests + 36 security tests = 78 total validation tests

### 2. Output Validation

#### Photo URL Validation (src/services/security-validator.ts)

```typescript
// Photo URL whitelist
✅ https://lh3.googleusercontent.com/*
✅ https://lh4.googleusercontent.com/*
✅ https://lh5.googleusercontent.com/*
❌ All other domains rejected
❌ data: URIs rejected
❌ javascript: URIs rejected
```

#### Caption Sanitization

```typescript
// JSON.stringify handles:
✅ Quote escaping (" → \")
✅ Backslash escaping (\ → \\)
✅ Control character escaping (\n, \r, \t)
✅ Unicode character encoding

// Additional validation:
✅ Max length: 5000 characters (DoS prevention)
✅ Whitespace trimming
✅ Null/empty handling
```

#### Metadata Validation

```typescript
// Photo count
✅ Range: 0-50,000
❌ Negative values rejected
❌ Values > 50,000 clamped

// Timestamps
✅ ISO 8601 format required
✅ Invalid dates fallback to current time

// Album names
✅ Max length: 500 characters
✅ Empty names fallback to default
```

**Test Coverage**: 35 security validator tests

### 3. API Security

#### Security Headers (src/index.ts)

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
```

#### CORS Configuration

```typescript
// Allowed origins (whitelist)
✅ https://hossain-khan.github.io (GitHub Pages)
✅ https://usetrmnl.com (TRMNL platform)
✅ http://localhost:8787 (Development)
✅ http://localhost:3000 (Development)

// Allowed methods
✅ GET, OPTIONS only
❌ POST, PUT, DELETE rejected
```

#### Rate Limiting

- **Cloudflare Built-in**: 100,000 requests/day per account (Free tier)
- **Worker Limits**: 100,000 requests/day per worker (Free tier)
- **KV Cache**: Reduces API calls to Google Photos (1-hour TTL)

### 4. Error Handling

#### No Sensitive Data in Errors

```typescript
// ❌ BAD (leaks album URL)
error: 'Failed to fetch album: https://photos.app.goo.gl/QKGRYqfdS15bj8Kr5';

// ✅ GOOD (generic message)
error: 'Album not found. The album may have been deleted or made private.';
```

#### Structured Logging

```typescript
// ❌ No album URLs logged
// ❌ No photo URLs logged
// ❌ No user identifiers logged
// ✅ Only error types and timestamps logged

log('error', 'Photo fetch failed', {
  error: errorMessage,
  fetchDuration: 1234,
  // NO album_url, NO photo URLs
});
```

### 5. Dependency Security

#### Current Vulnerabilities (npm audit)

```
3 low severity vulnerabilities
└── undici@7.0.0-7.18.1 (transitive via wrangler)
    CVE: Resource exhaustion via unbounded decompression
    Severity: Low (CVSS 3.7)
    Impact: Minimal (dev dependency only, not in production)
```

**Status**: Acceptable for v1.0 (low severity, dev dependency)

**Mitigation**: Will upgrade wrangler in future update

#### Trusted Dependencies

- **hono**: Well-maintained Cloudflare Workers framework
- **zod**: Industry-standard schema validation
- **google-photos-album-image-url-fetch**: 3rd-party library (verified safe)

### 6. Privacy & PII

#### Zero PII Collection

```typescript
// ❌ No user data stored
// ❌ No authentication tokens
// ❌ No album URLs persisted
// ❌ No photo metadata stored

// ✅ Completely stateless
// ✅ KV cache contains only photo lists (public data)
// ✅ No personally identifiable information
```

## Security Testing

### Test Suite Summary

| Test Suite         | Tests   | Coverage            |
| ------------------ | ------- | ------------------- |
| URL Parser         | 42      | Input validation    |
| Security Tests     | 36      | XSS, DoS, injection |
| Security Validator | 35      | Output validation   |
| Cache Service      | 9       | Caching logic       |
| Performance        | 15      | Load testing        |
| **Total**          | **181** | **Comprehensive**   |

### Security Test Scenarios

1. **XSS Prevention**
   - javascript: URI rejection ✅
   - data: URI rejection ✅
   - Embedded script tags ✅
   - JSON breaking characters ✅

2. **DoS Prevention**
   - Long URL rejection (>2048 chars) ✅
   - Long album ID rejection (>200 chars) ✅
   - Caption length limits (5000 chars) ✅

3. **Injection Prevention**
   - SQL injection patterns ✅
   - JSON injection ✅
   - Unicode/emoji rejection ✅

4. **Domain Validation**
   - Phishing domain rejection ✅
   - Subdomain attack prevention ✅
   - HTTP (non-HTTPS) rejection ✅

## Vulnerability Reporting

### Security Contact

**Email**: Use GitHub Issues for non-critical vulnerabilities

For **critical security vulnerabilities**, please:

1. Do NOT open a public issue
2. Email the repository owner directly (see GitHub profile)
3. Include detailed steps to reproduce
4. Allow 90 days for fix before public disclosure

### Response Process

1. **Acknowledgment**: Within 48 hours
2. **Investigation**: Within 7 days
3. **Fix & Deploy**: Within 30 days (critical), 90 days (non-critical)
4. **Disclosure**: Coordinated disclosure after fix deployed

## Security Checklist

For contributors adding new features:

- [ ] All inputs validated with Zod schemas
- [ ] URL length limits enforced
- [ ] Output sanitization applied
- [ ] Security tests added
- [ ] No sensitive data logged
- [ ] Error messages are generic
- [ ] npm audit shows no high/critical vulnerabilities
- [ ] Security headers configured

## Compliance

### OWASP Guidelines

- ✅ Input validation (ASVS 5.1)
- ✅ Output encoding (ASVS 5.3)
- ✅ Secure headers (ASVS 14.4)
- ✅ Error handling (ASVS 7.4)
- ✅ Logging best practices (ASVS 7.1)

### GDPR Compliance

- ✅ No personal data collected
- ✅ No cookies or tracking
- ✅ Stateless architecture (no data retention)
- ✅ No user profiling

## Security Updates

| Date       | Version | Update                          |
| ---------- | ------- | ------------------------------- |
| 2026-01-19 | 0.1.0   | Initial security implementation |

## References

- [OWASP JSON Security Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/AJAX_Security_Cheat_Sheet.html)
- [Cloudflare Workers Security](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [TRMNL Plugin Security Guidelines](https://docs.usetrmnl.com/security)
- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)

## License

This security policy is part of the TRMNL Google Photos Plugin project, licensed under MIT.
