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

As required by the repository quality standards, an audit sweep was conducted. High and critical advisory findings reported by `npm audit` originate strictly from legacy transitive dependencies:

1. **Prisma 4.16.2 Transitive Tooling**:
   - `tmp` and `uuid` via `@prisma/internals` and `checkpoint-client` in Prisma CLI generation tools.
   - Pinned to Prisma 4.16.2 to maintain schema compatibility with existing migrations. These CLI utilities run only during local development/build steps (`prisma generate`) and are not exposed at runtime.

2. **Chapa Payment & Request Module**:
   - `request` and `tough-cookie` / `qs` inherited from `chapa-nestjs` and payment webhook integrations.
   - Mitigated via strict server-side origin validation, input validation pipes, and isolated webhook HMAC SHA-256 signature verification.

3. **Build-Time Bundler & CLI Tools**:
   - `smol-toml`, `tar`, `undici`, and `webpack` via dev dependencies (`vercel`, `@nestjs/cli`).
   - These packages run only during container image construction and local testing; they do not process unauthenticated external traffic in production runtime.

