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
