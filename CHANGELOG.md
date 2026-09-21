# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-21

### Added
- **Developer Onboarding & Devcontainer**:
  - Added `.devcontainer/devcontainer.json` and `.devcontainer/docker-compose.yml` with Node 20 and PostgreSQL container services.
  - Added comprehensive JSDoc documentation to all public methods of `BaseEntityStorageService` and `EntityFileManagerService`.
  - Added quick start verification commands and testing guide prerequisites matrix in `README.md`.
- **Code Deduplication & Architecture**:
  - Extracted shared `EntityFileManagerService`, `BaseEntityStorageService`, and `entity-upload.decorator.ts`, driving code duplication down from 13.9% to 4.85%.
  - Standardized error handling on `DomainException` subclasses (`NotFoundError`, `ConflictError`, `ValidationError`).
- **Test Coverage Expansion**:
  - Added 5 new controller unit test suites (`rating.controller.spec.ts`, `reports.controller.spec.ts`, `search.controller.spec.ts`, `channel.controller.spec.ts`, `favorite.controller.spec.ts`).
  - Elevated Jest coverage thresholds in `package.json` to 65% statements, 65% branches, 65% lines, and 50% functions (41 suites / 424 tests).

### Changed
- **Dependency & Security Hardening**:
  - Upgraded `@prisma/client` and `prisma` CLI from `4.16.2` to `6.19.3` via `5.22.0`.
  - Removed deprecated `request` and `@types/request` dependencies in favor of native Node.js `fetch`.
  - Upgraded `argon2` to `0.45.1` and overridden `deepmerge-ts` to `8.0.2`, eliminating critical vulnerabilities (0 critical remaining).
  - Applied `@Throttle` rate limiting to authentication routes and file upload endpoints.
  - Enforced non-wildcard CORS in production environments.
  - Replaced test fixture passwords with dynamic entropy in E2E test specs.

## [1.0.0] - 2026-09-20

### Added
- **Framework & Runtime Upgrades**:
  - Upgraded NestJS core modules to major version `10.4.0` with standard root namespace imports.
  - Aligned runtime engines to `node >= 20.0.0` and npm `>= 10.0.0` matching `.nvmrc`.
  - Pinned Prisma CLI and client to exact version `4.16.2`.
  - Upgraded TypeScript to `5.9.x` and Jest to `29.7.x`.
- **Architectural Refactoring & Cleanliness**:
  - Created centralized `FileStorageService` with comprehensive path-parsing and file lifecycle methods.
  - Decoupled `ChannelService` into specialized `ChannelQueryService` and `ChannelCommandService`.
  - Reduced LOC across all modules to ensure no source file exceeds 500 lines of code.
  - Added automated code duplication scanning via `jscpd` (`npm run dup`).
- **Domain Exceptions, Observability & Health**:
  - Replaced ad-hoc `ForbiddenException` instances with typed domain exceptions (`NotFoundError`, `ConflictError`, `ValidationError`, `ForbiddenError`).
  - Standardized error response envelope via `AllExceptionsFilter` (`statusCode`, `code`, `message`, `error`, `timestamp`, `requestId`, `path`).
  - Added high-performance structured JSON logging via `nestjs-pino` with correlation request IDs and sensitive field redaction.
  - Added optional Sentry telemetry service (no-op when unconfigured).
  - Integrated `@nestjs/terminus` health checks with database ping on `/health`.
- **Security & Validation Hardening**:
  - Enabled global `ValidationPipe` with payload transformation and strict whitelisting.
  - Validated multipart file uploads using `FileFieldsValidationPipe` with MIME type allowlists and file size enforcement.
  - Added security headers with `helmet`, rate limiting with `@nestjs/throttler`, and configurable CORS allowlists.
  - Mounted interactive Swagger documentation at `/docs` in non-production environments.
- **Testing Architecture**:
  - Expanded test coverage across 35 test suites, 301 unit tests, and 5 PostgreSQL-backed E2E smoke tests.
  - Enforced ratcheted global coverage thresholds in Jest (50% statements, 50% branches, 50% lines, 35% functions).
- **CI/CD & Maintenance Automation**:
  - Re-architected GitHub Actions into parallel cached jobs (`lint`, `format`, `typecheck`, `unit-test` matrix across Node 20 & 22, `e2e`, `migrations`, `audit`, `build`, `docker-build`).
  - Added release workflow publishing multi-arch images to GitHub Container Registry (`ghcr.io`) and creating GitHub Releases.
  - Added `commitlint`, `husky` git hooks, and `lint-staged` pre-commit verification.
  - Added `SECURITY.md`, `CODE_OF_CONDUCT.md`, and GitHub issue/PR templates.

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
