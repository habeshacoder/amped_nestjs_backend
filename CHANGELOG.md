# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Quality Gates & CI/CD Pipeline**:
  - Added `.github/workflows/ci.yml` running lint, format check, typecheck, unit test coverage, and build checks on pull requests and pushes.
  - Added Node.js version constraint (`.nvmrc` set to 20 and `engines.node >= 20.0.0` in `package.json`).
  - Added `format:check` script using Prettier.
  - Added `typecheck` script using `tsc --noEmit`.
- **Environment & Secrets Hygiene**:
  - Added `.env.example` and `.env.test.example` with clear configuration documentation.
  - Added `.dockerignore` preventing credential and node_modules leakage.
  - Added startup configuration schema validation with `Joi` in `AppModule`.
  - Converted Chapa payment modules to asynchronous configuration via `ConfigService`.
  - Added dynamic server port resolution (`process.env.PORT || 3007`).
- **Testing Architecture**:
  - Created 20 comprehensive test suites spanning 125 unit and integration tests across services, controllers, strategies, and webhooks.
  - Added unit test suites for `AuthService`, `AuthController`, `JwtStrategy`, `RefreshTokenStrategy`, `UserController`, `ReportService`, `FavoriteService`, `RatingService`, `ChannelWebhook`, `MaterialWebhook`, `SearchService`, `SubscriptionPlanService`, `ReplayService`, `SubscribedUserService`, `SocialLinksProfileService`, `ChannelService`, `MaterialService`, `ProfilesService`, `SellerProfilesService`, and `ChannelMaterialService`.
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
  - Fixed 9 ESLint violations across codebase including unused variables and missing return statements.
- **Code Cleanliness**:
  - Stripped dead commented-out code blocks in `profiles.service.ts` and `app.module.ts`.
  - Applied consistent Prettier code formatting across all TypeScript sources.
