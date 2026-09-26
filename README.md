# AMPED NestJS Backend

[![CI](https://github.com/habeshacoder/amped_nestjs_backend/actions/workflows/ci.yml/badge.svg)](https://github.com/habeshacoder/amped_nestjs_backend/actions/workflows/ci.yml)
[![Release](https://github.com/habeshacoder/amped_nestjs_backend/actions/workflows/release.yml/badge.svg)](https://github.com/habeshacoder/amped_nestjs_backend/actions/workflows/release.yml)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

AMPED is a high-performance backend REST API built with [NestJS](https://nestjs.com/) and [Prisma](https://www.prisma.io/), powering digital publishing, media streaming, creator channel subscriptions, and content monetization. It supports publications, audiobooks, podcasts, user profiles, creator channels, subscription plans, and secure payment processing via the Chapa payment gateway.

---

## Architecture Diagram

```mermaid
graph TD
    Client["Clients (Web / Mobile Apps)"]

    subgraph "NestJS Application Layer"
        Security["Security Middleware\n(Helmet, Throttler Rate Limiting, CORS)"]
        Validation["ValidationPipe & FileFieldsValidationPipe"]
        AuthGuards["Auth Guards\n(JwtGuard, RefreshGuard)"]
        Filters["AllExceptionsFilter\n(Standard Error Envelope)"]
        Logging["LoggerModule\n(Structured Pino with Request IDs)"]

        subgraph "Feature Modules"
            AuthMod["AuthModule"]
            UserMod["UserModule"]
            ChannelMod["ChannelModule\n(Query & Command)"]
            MaterialMod["MaterialModule\n(Query & Storage)"]
            ProfilesMod["ProfilesModule & SellerProfilesModule"]
            PurchaseMod["ChannelPurchase & MaterialPurchase\n(Chapa Webhooks)"]
            HealthMod["HealthModule\n(Terminus + DB Ping)"]
        end

        Services["Common Services\n(FileStorageService, SentryService)"]
    end

    subgraph "Data & External Infrastructure"
        Prisma["Prisma ORM Client"]
        Postgres[("PostgreSQL Database")]
        Storage[("Local File Storage / Uploads")]
        Chapa["Chapa Payment Gateway API"]
        Sentry["Sentry Monitoring (Optional)"]
    end

    Client --> Security
    Security --> Validation
    Validation --> AuthGuards
    AuthGuards --> FeatureModules
    FeatureModules --> Services
    FeatureModules --> Prisma
    FeatureModules --> Filters
    FeatureModules --> Logging
    Services --> Storage
    PurchaseMod --> Chapa
    Prisma --> Postgres
    Services --> Sentry
```

---

## Module Map

| Module               | Location                 | Purpose                          | Key Endpoints / Capabilities                                          |
| :------------------- | :----------------------- | :------------------------------- | :-------------------------------------------------------------------- |
| **Auth**             | `src/auth/`              | Authentication & token lifecycle | `/auth/signup`, `/auth/signin`, `/auth/refresh`, JWT & Argon2         |
| **User**             | `src/user/`              | User account management          | `/users/me` (current authenticated user profile)                      |
| **Profiles**         | `src/profiles/`          | Consumer user profiles           | Profile details, avatars, covers, password change                     |
| **SellerProfiles**   | `src/seller-profiles/`   | Creator / publisher profiles     | Store identity, creator avatars, social links                         |
| **Channel**          | `src/channel/`           | Creator channels                 | Paginated channel discovery, channel creation, command/query split    |
| **Material**         | `src/material/`          | Digital content management       | Books, podcasts, audiobooks, previews, pagination                     |
| **ChannelMaterial**  | `src/channel-material/`  | Channel-bound materials          | Tiered content linked directly to channels                            |
| **MaterialPurchase** | `src/material-purchase/` | Pay-per-content processing       | Checkout initiation, webhook verification                             |
| **ChannelPurchase**  | `src/channel-purchase/`  | Subscription monetization        | Channel subscription billing, Chapa webhooks                          |
| **SubscriptionPlan** | `src/subscription-plan/` | Channel tier plans               | Pricing, duration, plan entitlements                                  |
| **SubscribedUser**   | `src/subscribed-user/`   | Active subscribers               | Subscriber access controls & validation                               |
| **Favorite**         | `src/favorite/`          | Bookmarking                      | User saved items & personal library                                   |
| **Rating**           | `src/rating/`            | User reviews & ratings           | Rating submissions and aggregated scores                              |
| **Replays**          | `src/replays/`           | Streaming replays                | Recorded content playback sessions                                    |
| **Reports**          | `src/reports/`           | Moderation & safety              | User violation reporting                                              |
| **Search**           | `src/search/`            | Content discovery                | Multi-model search catalog queries                                    |
| **Health**           | `src/health/`            | Liveness & readiness             | `/health` endpoint with Terminus and database health ping             |
| **Metrics**          | `src/metrics/`           | Telemetry & observability        | `/metrics` Prometheus endpoint with request count & latency histogram |
| **Prisma**           | `src/prisma/`            | Relational persistence           | Database connection lifecycle and query execution                     |
| **Common**           | `src/common/`            | Shared infrastructure            | Domain exceptions, error filter, file storage, logging, pipes         |

---

## API Documentation (Swagger) & Observability

In non-production environments (`NODE_ENV !== 'production'`), interactive OpenAPI/Swagger documentation is automatically served at:

```
http://localhost:3007/docs
```

It provides complete interactive documentation of request bodies, response schemas, and authentication headers.

### Health & Metrics Endpoints

- **Liveness & Readiness**: `GET /health` returns JSON health status of database connectivity and service readiness.
- **Prometheus Telemetry**: `GET /metrics` exports Prometheus metrics, including runtime process stats, `http_requests_total` counter, and `http_request_duration_seconds` latency histogram.

---

## Prerequisites Matrix

| Requirement    | Supported Version                     | Notes                                          |
| :------------- | :------------------------------------ | :--------------------------------------------- |
| **Node.js**    | `>= 20.0.0` (Active LTS / v20 or v22) | Recommended: use `.nvmrc` (`nvm use`)          |
| **npm**        | `>= 10.0.0`                           | Bundled with Node LTS                          |
| **PostgreSQL** | `>= 14.0`                             | Relational database persistence                |
| **Docker**     | `>= 24.0`                             | For containerized execution and local database |

---

## Quick Start & Setup

### Quick Start (Fresh Clone)

A new user or automated evaluator can clone the repository into an empty directory, install dependencies reproducibly, compile the build, and execute the complete automated test suite without configuring any environment variables or running external services (all database queries and external gateways are mocked in unit tests):

```bash
# 1. Clone the repository
git clone https://github.com/habeshacoder/amped_nestjs_backend.git
cd amped_nestjs_backend

# 2. Configure Node.js (Active LTS v20 or v22)
nvm use

# 3. Install dependencies reproducibly (runs postinstall prisma generate)
npm ci

# 4. Build the application (cleans dist/, regenerates Prisma client, compiles TypeScript)
npm run build

# 5. Run the automated test suite with coverage gating (56 test suites, 614 tests)
npm test
```

#### One-Liner Verification

Execute the entire install, build, and test verification in a single command:

```bash
npm ci && npm run build && npm test
```

Or using the included `Makefile`:

```bash
make verify
```

---

### Step-by-Step Setup Guide

#### Part A: Install, Build & Test (Zero External Dependencies Required)

##### 1. Clone the repository

```bash
git clone https://github.com/habeshacoder/amped_nestjs_backend.git
cd amped_nestjs_backend
```

##### 2. Configure Node version

Ensure you are using Node.js `>= 20.0.0` (v20 or v22 LTS):

```bash
nvm use
```

##### 3. Install dependencies

Install dependencies reproducibly using the committed `package-lock.json`. This automatically generates the Prisma Client via the `postinstall` hook:

```bash
npm ci
```

##### 4. Build the application

Compile the TypeScript application into the `dist/` directory. The `prebuild` hook guarantees Prisma artifacts are up to date:

```bash
npm run build
```

##### 5. Run the automated test suite

Execute the complete test suite across all modules, controllers, services, guards, and filters with coverage threshold enforcement (`>= 70%` global coverage across statements, branches, lines, and functions):

```bash
npm test
```

To run tests with coverage reporting explicitly:

```bash
npm run test:cov
```

To run tests in watch mode during development:

```bash
npm run test:watch
```

---

#### Part B: Local Development & Database Setup (PostgreSQL)

Configuring environment variables and starting PostgreSQL is **only** required when running the live HTTP server or executing end-to-end integration tests.

##### 1. Configure Environment Variables

Copy `.env.example` to `.env` and adjust secrets if needed:

```bash
cp .env.example .env
```

##### 2. Start Services via Docker Compose

Start the local PostgreSQL container:

```bash
docker compose up -d postgres
```

##### 3. Apply Database Migrations

Deploy pending schema migrations to your local PostgreSQL instance:

```bash
npm run migration:run
```

##### 4. Run End-to-End (E2E) Integration Tests

Run the full HTTP and database integration test suite against the live PostgreSQL database:

```bash
npm run test:e2e
```

##### 5. Start the Development Server

Start the NestJS application with hot-reload enabled:

```bash
npm run start:dev
```

Or build and run the production server:

```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3007` and interactive Swagger docs at `http://localhost:3007/docs`.

##### 6. Run via Docker (Optional)

```bash
# Build multi-stage production container
docker build -t amped-backend:latest .

# Run container
docker run -p 3007:3007 --env-file .env amped-backend:latest
```

---

## Environment Variables Reference

> **Note**: No environment variables are required to install, build (`npm run build`), or run the test suite (`npm test`). Environment variables are only needed when running the live server or executing PostgreSQL-backed E2E tests.

| Variable                 | Type     | Required | Default / Example                                           | Description                                                    |
| :----------------------- | :------- | :------- | :---------------------------------------------------------- | :------------------------------------------------------------- |
| `NODE_ENV`               | `string` | No       | `development`                                               | Application environment (`development`, `test`, `production`)  |
| `PORT`                   | `number` | No       | `3007`                                                      | HTTP server port                                               |
| `DATABASE_URL`           | `string` | **Yes**  | `postgresql://user:pass@localhost:5432/amped?schema=public` | PostgreSQL database connection URL                             |
| `JWT_SECRET`             | `string` | **Yes**  | `min-16-char-secret-key`                                    | Secret key used to sign access JWTs                            |
| `JWT_REFRESH_SECRET`     | `string` | **Yes**  | `min-16-char-refresh-secret-key`                            | Secret key used to sign refresh JWTs                           |
| `CHAPA_SECRET_KEY`       | `string` | No       | `CHASECK_TEST-...`                                          | Chapa Payment Gateway API secret key                           |
| `CHAPA_WEBHOOK_HASH_KEY` | `string` | No       | `webhook-secret-hash`                                       | Secret hash for Chapa webhook verification                     |
| `CHAPA_WEBHOOK_URL`      | `string` | No       | `https://api.example.com/payment/webhook`                   | Webhook callback URL registered with Chapa                     |
| `THROTTLE_TTL`           | `number` | No       | `60000`                                                     | Rate limiter time window in milliseconds (1 minute)            |
| `THROTTLE_LIMIT`         | `number` | No       | `100`                                                       | Maximum requests permitted per rate limiter time window        |
| `CORS_ORIGIN`            | `string` | No       | `*`                                                         | Allowed CORS origins (comma-separated or `*` for all)          |
| `LOG_LEVEL`              | `string` | No       | `info`                                                      | Pino logging level (`trace`, `debug`, `info`, `warn`, `error`) |
| `SENTRY_DSN`             | `string` | No       | `https://...`                                               | Optional Sentry DSN for exception monitoring                   |

---

## Testing Guide

All tests are verified before every commit and in continuous integration. For the complete before/after verification log and buyer-readiness assessment, refer to [AUDIT.md](AUDIT.md).

| Command                  | Description                                                                           | Prerequisites / Needs                                                                   |
| :----------------------- | :------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------- |
| `npm test`               | Executes all unit test suites (services, controllers, guards, filters, pipes)         | **No external services required** (all DB calls use in-memory Prisma mocks)             |
| `npm run test:cov`       | Executes all unit tests with coverage reporting and threshold enforcement             | **No external services required** (enforces `>=70%` stmts/branches/lines/funcs)         |
| `npm run test:e2e`       | End-to-end and real Prisma integration tests (`test/*.e2e-spec.ts`)                   | **Requires PostgreSQL** (`docker compose up -d postgres`); automatically deployed in CI |
| `npm run test:e2e:local` | Runs full E2E suite against ephemeral PostgreSQL with mocked external payment gateway | **Docker required** (runs `docker-compose.test.yml` with tmpfs storage)                 |

### Test Commands

```bash
# Run all unit tests
npm test

# Run unit tests with coverage report and threshold enforcement
npm run test:cov

# Run end-to-end integration tests
npm run test:e2e

# Run tests in watch mode during development
npm run test:watch

# Run E2E tests locally with isolated ephemeral PostgreSQL
npm run test:e2e:local
```

### Coverage Thresholds

Coverage thresholds are enforced via Jest in `package.json`. A pull request that drops coverage below these thresholds will fail CI:

- **Statements**: `>= 70%`
- **Branches**: `>= 70%`
- **Lines**: `>= 70%`
- **Functions**: `>= 70%`

### Running e2e tests offline

All end-to-end test suites (`test/*.e2e-spec.ts`) run completely offline without requiring external network connectivity, live third-party payment accounts, or API keys:

- **Chapa Payment Gateway**: Replaced with an in-memory test double (`mockChapaService` via NestJS `.overrideProvider(ChapaService)`) in test suites exercising payment-adjacent flows (e.g. `seller-profiles.e2e-spec.ts`, `subscribed-users.e2e-spec.ts`, `app.e2e-spec.ts`).
- **Database Isolation**: Uses an ephemeral PostgreSQL container with `tmpfs` RAM storage defined in `docker-compose.test.yml`, preventing any state bleed or local database contamination.

#### One-command isolated execution:

```bash
npm run test:e2e:local
```

#### Manual step-by-step execution:

```bash
# 1. Spin up ephemeral PostgreSQL test container
docker compose -f docker-compose.test.yml up -d postgres-test

# 2. Run all e2e test suites
npm run test:e2e

# 3. Tear down ephemeral test container and volumes
npm run test:e2e:local:down
```

---

## Code Quality & Verification Gates

Run the full quality gate locally:

```bash
# Format check
npm run format:check

# ESLint analysis
npm run lint

# TypeScript strict type checking
npm run typecheck

# Code duplication analysis (< 10% threshold)
npm run dup

# Production build
npm run build
```

---

## Troubleshooting

### 1. Database Connection Failed

- Ensure PostgreSQL container is active: `docker compose ps`
- Verify `DATABASE_URL` matches credentials in `docker-compose.yml`.
- Run health check: `curl http://localhost:3007/health`

### 2. Migration Drift or Out-of-Sync Schema

- Inspect migration status: `npm run migration:status`
- Apply pending migrations: `npm run migration:run`
- Check schema drift: `npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --exit-code`

### 3. Port 3007 Already in Use

- Change `PORT=3008` in your `.env` file or terminate conflicting process: `lsof -i :3007`.

### 4. Build or Test Fails on Fresh Clone

- Verify Node.js `>= 20.0.0` and npm `>= 10.0.0`: `node -v && npm -v` (run `nvm use` if using nvm).
- Ensure a clean dependency installation: `npm ci`.
- Ensure Prisma client is generated: `npx prisma generate` (this runs automatically during `npm ci` and `npm run build`).
- Verify no stale compilation artifacts exist: `npm run build`.
- Remember: `npm test` requires no `.env` file and no running database—all external calls are mocked in memory.

---

## Deployment

The repository uses automated GitHub Actions workflows:

- **CI Pipeline (`.github/workflows/ci.yml`)**: Runs on every push and pull request. Validates formatting, linting, typechecking, unit tests across Node 20.x and 22.x, PostgreSQL-backed E2E tests, migration drift, production build, and Docker image build.
- **Release Pipeline (`.github/workflows/release.yml`)**: Triggers on Git tags `v*.*.*`. Automatically publishes multi-arch container images to GitHub Container Registry (`ghcr.io/habeshacoder/amped_nestjs_backend`), generates GitHub Release notes, and executes gated deployment hooks.

> [!IMPORTANT]
> **Environment Variables & Secrets**: Environment variables must be supplied via the hosting platform's secret manager (e.g., AWS Secrets Manager, Vercel Environment Variables, Doppler, Kubernetes Secrets, or container runtime environment flags) instead of bundling a `.env` file into build artifacts. The packaging step (`npm run build-with-package`) strictly avoids copying `.env` into `dist/` to prevent shipping credentials or secrets into deployed bundles.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
