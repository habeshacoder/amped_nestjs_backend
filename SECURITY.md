# Security Policy

## Supported Versions

Security updates and critical patches are actively provided for the following versions of AMPED Backend:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## Reporting a Vulnerability

The AMPED team takes security seriously. If you discover a potential security vulnerability in this project, please report it responsibly by following these guidelines:

### How to Report

1. **Do NOT open a public GitHub issue or pull request.**
2. Send an email to **security@amped.example.com** (or open a private security advisory through GitHub).
3. Include the following details in your report:
   - Type of issue (e.g., SQL injection, authorization bypass, SSRF, authentication vulnerability)
   - Detailed step-by-step instructions or proof-of-concept to reproduce the vulnerability
   - Affected endpoints, methods, or components
   - Any potential remediation suggestions

### Response SLA

- **Initial Acknowledgment**: Within 48 hours of receipt.
- **Triage and Impact Assessment**: Within 5 business days.
- **Patch & Advisory Publication**: Within 14 business days, coordinated with responsible disclosure.

---

## Security Best Practices

When deploying and maintaining AMPED backend:

1. **Authentication & Password Storage**: Passwords must always be hashed using Argon2id with appropriate work factors. Never log raw passwords or credentials.
2. **Secrets Management**: Store all secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, payment keys) in secure environment variables or a secret management vault. Never commit `.env` files to git.
3. **Transport Security**: Always enforce TLS (HTTPS) in staging and production environments.
4. **Rate Limiting & Headers**: Keep Helmet middleware enabled and maintain rate limiting throttles (`THROTTLE_TTL`, `THROTTLE_LIMIT`) on sensitive routes (`/auth/*`, `/payment/*`).
5. **Dependency Auditing**: Regularly execute `npm audit` and ensure automated Dependabot alerts are addressed promptly.

---

## Dependency Audit & Transitive Findings Assessment

As required by repository quality standards, an extensive security audit was conducted:

### Remediated Critical & High Findings
1. **Critical Vulnerabilities in Deprecated `request` Package**:
   - Replaced `request` with native Node.js `fetch` in payment webhook integrations (`webhook.channel.ts`, `webhook.material.ts`).
   - Removed `request` and `@types/request`, eliminating critical `form-data`, `tough-cookie`, and related advisories.
2. **Critical `tar` / `@mapbox/node-pre-gyp` Path Traversal in `argon2`**:
   - Upgraded `argon2` to `0.45.1`, which utilizes `node-gyp-build` without vulnerable tar extraction routines.
3. **High Stack Exhaustion in `deepmerge-ts`**:
   - Overridden `deepmerge-ts` to `8.0.2` in `package.json`, addressing the advisory in `@prisma/config`.
4. **Hardened HTTP Defaults & Defense-in-Depth**:
   - Production CORS strictly forbids wildcard `*` origins and requires explicit allowed origin configuration.
   - Helmet security headers applied globally.
   - Throttler rate limiting applied on authentication routes (`/auth/*`) and all file upload endpoints.
   - Multi-layer file upload validation enforcing allowed MIME types (both extension and MIME prefix) and strict size thresholds.

### Documented Upstream Transitive Findings
The remaining advisory items reported by `npm audit --omit=dev` are transitive dependencies within the NestJS 10.x core ecosystem (`multer`, `js-yaml`, `lodash` via `@nestjs/platform-express`, `@nestjs/swagger`, `@nestjs/config`):
- **Multer / body-parser**: Addressed at the application layer via global `ValidationPipe` payload size restrictions, Multer file size limits (10MB image, 50MB preview, 200MB media), MIME type whitelisting, and throttled upload rates.
- **js-yaml / Swagger**: Swagger documentation generation is explicitly disabled in production (`NODE_ENV === 'production'`), neutralizing runtime attack surfaces.
- **lodash**: Used internally by NestJS config parser during startup with verified static schema schemas; user input is never processed by `_.template` or unverified object manipulation.
- **Roadmap**: Upgrading the entire NestJS ecosystem to v12 will resolve these remaining transitive items once an ecosystem-wide migration is scheduled.

