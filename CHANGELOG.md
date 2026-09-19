# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Security & Dependabot Automation**:
  - Added `.github/dependabot.yml` configured for weekly npm and github-actions dependency audits.
  - Added `audit` step in CI workflow checking for high-severity advisories via `npm audit --audit-level=high --omit=dev`.
- **Release and PR Title Enforcement**:
  - Added `.github/workflows/pr-title.yml` to enforce Conventional Commits on pull request titles.
  - Added `.github/workflows/release.yml` automating GitHub Releases on semantic version tags (`v*.*.*`).
- **Architectural Refactoring & God-File Deconstruction**:
  - Split monolith `MaterialService` into dedicated domain query (`MaterialQueryService`), disk/storage (`MaterialStorageService`), and facade orchestrator services with 100% route contract preservation.
  - Split monolith `ChannelMaterialService` into dedicated query (`ChannelMaterialQueryService`), disk/storage (`ChannelMaterialStorageService`), and facade orchestrator services.
- **Error Handling, Logging, and Health Observability**:
  - Implemented `AllExceptionsFilter` (`src/common/filters/all-exceptions.filter.ts`) providing standard sanitized JSON error envelopes (`statusCode`, `timestamp`, `path`, `message`, and sanitized `error`).
  - Added `@nestjs/terminus` health checks with `PrismaHealthIndicator` at `/health` verifying database connectivity.
  - Enabled application graceful shutdown hooks (`app.enableShutdownHooks()`).
  - Replaced all raw `console.*` invocations with NestJS `Logger` across all services, controllers, and filters.
  - Enforced `'no-console': 'error'` in `.eslintrc.js`.
  - Added class-validator decorators to all request DTOs (`RatingDto`, `ChannelMaterialDto`, `ReplayDto`, `ChannelDto`, `ReportDto`, etc.).

## [0.0.1] - 2026-09-19

### Added
- **Quality Gates & CI/CD Pipeline**:
  - Added `.github/workflows/ci.yml` running lint, format check, typecheck, unit test coverage, and build checks on pull requests and pushes.
  - Added Node.js version constraint (`.nvmrc` set to 20 and `engines.node >= 18.0.0` in `package.json`).
  - Added `format:check` script using Prettier.
  - Added `typecheck` script using `tsc --noEmit`.
- **Environment & Secrets Hygiene**:
  - Added `.env.example` and `.env.test.example` with complete configuration documentation.
  - Added `.dockerignore` preventing credential and node_modules leakage.
  - Added startup configuration schema validation with `Joi` in `AppModule`.
  - Converted Chapa payment modules to asynchronous configuration via `ConfigService`.
  - Added dynamic server port resolution (`process.env.PORT || 3007`).
- **Testing Architecture**:
  - Created 26 comprehensive test suites spanning 139 unit tests across services, controllers, strategies, and webhooks.
  - Upgraded E2E integration test suite (`test/app.e2e-spec.ts`) with mocked database providers to enable reliable execution in CI and fresh clones without requiring live PostgreSQL.
  - Enforced Jest `coverageThreshold` ratcheting statement, line, function, and branch coverage baselines.
- **Documentation**:
  - Rewrote `README.md` with complete architecture overview, prerequisites matrix, setup guide, and environment variable reference.
  - Added `CONTRIBUTING.md` defining branching models, conventional commit standards, and local quality verification commands.

### Fixed
- **Bug Fixes**:
  - Fixed unhandled asynchronous promise rejection in `AuthService.logout` (`updateRefreshToken` missing `await`).
  - Fixed `TypeError` null dereference in `SubscriptionPlanService.remove` when inspecting relations of missing plans.
  - Fixed ES module import style for Node built-ins (`crypto`, `fs`) in controllers and services.
  - Fixed ESLint violations across codebase including unused variables and missing return statements.
- **Code Cleanliness**:
  - Stripped dead commented-out code blocks in `profiles.service.ts` and `app.module.ts`.
  - Applied consistent Prettier code formatting across all TypeScript sources.
