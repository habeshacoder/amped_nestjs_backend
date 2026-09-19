# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Data Engineering & Schema Integrity**:
  - Authored timestamped migration `20260920020000_add_data_integrity_and_indexes` adding composite unique constraints on `favorite`, `ratings`, `material_user`, `material_in_subscription_plan`, and `subscribed_users`.
  - Added range and sanity CHECK constraints on `ratings.rating` (0 to 5), `materials.price` (>= 0), `materials.length_minute`/`page` (>= 0), and `subscription_plan.price` (>= 0).
  - Added lookup and JOIN performance indexes on foreign key columns across `materials`, `channels`, `channel_materials`, `ratings`, `favorite`, `reports`, and `replays`.
  - Added shadow database configuration and migration discipline scripts: `migration:run`, `migration:status`, `migration:generate`, and `migration:check`.
  - Added PostgreSQL 16 service container to GitHub Actions CI pipeline for migration verification.
  - Added `docker-compose.yml` for zero-configuration local PostgreSQL database startup.
  - Added `docs/data-model.md` containing full Mermaid Entity-Relationship Diagram (ERD), Data Dictionary, and Data Flow sequence diagrams.
- **Data Observability, Boundary Validation & Security**:
  - Enhanced `AllExceptionsFilter` with Prisma database error translations (`P2002` to 409 Conflict, `P2003` to 400 Bad Request, `P2025`/`P2001` to 404 Not Found, `P2000` to 400 Bad Request).
  - Updated global `ValidationPipe` to enable `transform: true` alongside `whitelist: true`.
  - Sanitized user responses in `UserController` (`/me`, `/all`) and `AuthService.logout` to strictly exclude `password` hashes and `refresh_token` credentials.
  - Migrated Prisma runtime imports to `@prisma/client/runtime/library`, eliminating deprecation warnings.
- **Expanded Test Coverage**:
  - Added `src/prisma/prisma-integrity.spec.ts` validating composite unique constraint violations, foreign key errors, and multi-step transaction rollbacks.
  - Added `src/social-links-channel/social-links-channel.service.spec.ts` covering full CRUD lifecycle and database error paths.
  - Expanded `src/channel/channel.service.spec.ts` and `src/seller-profiles/seller-profiles.service.spec.ts`.
  - Raised Jest coverage thresholds to 20% branches, 24% functions, 25% lines, and 26% statements across 28 suites (164 tests).

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
