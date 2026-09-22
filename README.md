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

| Module | Location | Purpose | Key Endpoints / Capabilities |
| :--- | :--- | :--- | :--- |
| **Auth** | `src/auth/` | Authentication & token lifecycle | `/auth/signup`, `/auth/signin`, `/auth/refresh`, JWT & Argon2 |
| **User** | `src/user/` | User account management | `/users/me` (current authenticated user profile) |
| **Profiles** | `src/profiles/` | Consumer user profiles | Profile details, avatars, covers, password change |
| **SellerProfiles** | `src/seller-profiles/` | Creator / publisher profiles | Store identity, creator avatars, social links |
| **Channel** | `src/channel/` | Creator channels | Paginated channel discovery, channel creation, command/query split |
| **Material** | `src/material/` | Digital content management | Books, podcasts, audiobooks, previews, pagination |
| **ChannelMaterial** | `src/channel-material/` | Channel-bound materials | Tiered content linked directly to channels |
| **MaterialPurchase** | `src/material-purchase/` | Pay-per-content processing | Checkout initiation, webhook verification |
| **ChannelPurchase** | `src/channel-purchase/` | Subscription monetization | Channel subscription billing, Chapa webhooks |
| **SubscriptionPlan** | `src/subscription-plan/` | Channel tier plans | Pricing, duration, plan entitlements |
| **SubscribedUser** | `src/subscribed-user/` | Active subscribers | Subscriber access controls & validation |
| **Favorite** | `src/favorite/` | Bookmarking | User saved items & personal library |
| **Rating** | `src/rating/` | User reviews & ratings | Rating submissions and aggregated scores |
| **Replays** | `src/replays/` | Streaming replays | Recorded content playback sessions |
| **Reports** | `src/reports/` | Moderation & safety | User violation reporting |
| **Search** | `src/search/` | Content discovery | Multi-model search catalog queries |
| **Health** | `src/health/` | Liveness & readiness | `/health` endpoint with Terminus and database health ping |
| **Prisma** | `src/prisma/` | Relational persistence | Database connection lifecycle and query execution |
| **Common** | `src/common/` | Shared infrastructure | Domain exceptions, error filter, file storage, logging, pipes |

---

## API Documentation (Swagger)

In non-production environments (`NODE_ENV !== 'production'`), interactive OpenAPI/Swagger documentation is automatically served at:
```
http://localhost:3007/docs
```
It provides complete interactive documentation of request bodies, response schemas, and authentication headers.

---

## Prerequisites Matrix

| Requirement | Supported Version | Notes |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` (Active LTS / v20 or v22) | Recommended: use `.nvmrc` (`nvm use`) |
| **npm** | `>= 10.0.0` | Bundled with Node LTS |
| **PostgreSQL** | `>= 14.0` | Relational database persistence |
| **Docker** | `>= 24.0` | For containerized execution and local database |

---

## Quick Start & Setup

### Quick start (fresh clone)

To go from a clean clone to a verified build and passing test suites in one command sequence:

```bash
# 1. Install dependencies & generate Prisma client
npm ci && npx prisma generate

# 2. Build the application
npm run build

# 3. Run unit tests with coverage enforcement
npm run test:cov

# 4. (Optional for local full-stack) Start PostgreSQL & run integration tests
docker compose up -d postgres
npm run test:e2e

# 5. Start development server
npm run start:dev
```

Or run the complete verification one-liner:
```bash
npm ci && npx prisma generate && npm run build && npm run test:cov
```

### 1. Clone the repository
```bash
git clone git@github.com:habeshacoder/amped_nestjs_backend.git
cd amped_nestjs_backend
```

### 2. Configure Node version
```bash
nvm use
```

### 3. Install dependencies
```bash
npm ci
```

### 4. Configure Environment Variables
Copy `.env.example` and set required secrets:
```bash
cp .env.example .env
```

### 5. Start Services via Docker Compose
```bash
# Start PostgreSQL database and application
docker compose up -d

# Run tests in Docker container
docker compose run --rm app npm test
```

### 6. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npm run migration:run
```

### 7. Run the Application
```bash
# Development mode with hot-reload
npm run start:dev

# Production build and start
npm run build
npm run start:prod
```

### 8. Run via Docker
```bash
# Build multi-stage production container
docker build -t amped-backend:latest .

# Run container
docker run -p 3007:3007 --env-file .env amped-backend:latest
```

---

## Environment Variables Reference

| Variable | Type | Required | Default / Example | Description |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | `string` | No | `development` | Application environment (`development`, `test`, `production`) |
| `PORT` | `number` | No | `3007` | HTTP server port |
| `DATABASE_URL` | `string` | **Yes** | `postgresql://user:pass@localhost:5432/amped?schema=public` | PostgreSQL database connection URL |
| `JWT_SECRET` | `string` | **Yes** | `min-16-char-secret-key` | Secret key used to sign access JWTs |
| `JWT_REFRESH_SECRET` | `string` | **Yes** | `min-16-char-refresh-secret-key` | Secret key used to sign refresh JWTs |
| `CHAPA_SECRET_KEY` | `string` | No | `CHASECK_TEST-...` | Chapa Payment Gateway API secret key |
| `CHAPA_WEBHOOK_HASH_KEY` | `string` | No | `webhook-secret-hash` | Secret hash for Chapa webhook verification |
| `CHAPA_WEBHOOK_URL` | `string` | No | `https://api.example.com/payment/webhook` | Webhook callback URL registered with Chapa |
| `THROTTLE_TTL` | `number` | No | `60000` | Rate limiter time window in milliseconds (1 minute) |
| `THROTTLE_LIMIT` | `number` | No | `100` | Maximum requests permitted per rate limiter time window |
| `CORS_ORIGIN` | `string` | No | `*` | Allowed CORS origins (comma-separated or `*` for all) |
| `LOG_LEVEL` | `string` | No | `info` | Pino logging level (`trace`, `debug`, `info`, `warn`, `error`) |
| `SENTRY_DSN` | `string` | No | `https://...` | Optional Sentry DSN for exception monitoring |

---

## Testing Guide

All tests are verified before every commit and in continuous integration.

| Command | Description | Prerequisites / Needs |
| :--- | :--- | :--- |
| `npm test` | Executes all unit test suites (services, controllers, guards, filters, pipes) | **No external services required** (all DB calls use in-memory Prisma mocks) |
| `npm run test:cov` | Executes all unit tests with coverage reporting and threshold enforcement | **No external services required** (enforces `>=65%` stmts/branches/lines, `>=50%` funcs) |
| `npm run test:e2e` | End-to-end and real Prisma integration tests (`test/app.e2e-spec.ts` & `src/*/*.integration.spec.ts`) | **Requires PostgreSQL** (`docker compose up -d postgres`); automatically deployed in CI |

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
```

### Coverage Thresholds
Coverage thresholds are enforced via Jest in `package.json`. A pull request that drops coverage below these thresholds will fail CI:
- **Statements**: `>= 65%`
- **Branches**: `>= 65%`
- **Lines**: `>= 65%`
- **Functions**: `>= 50%`

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

---

## Deployment

The repository uses automated GitHub Actions workflows:
- **CI Pipeline (`.github/workflows/ci.yml`)**: Runs on every push and pull request. Validates formatting, linting, typechecking, unit tests across Node 20.x and 22.x, PostgreSQL-backed E2E tests, migration drift, production build, and Docker image build.
- **Release Pipeline (`.github/workflows/release.yml`)**: Triggers on Git tags `v*.*.*`. Automatically publishes multi-arch container images to GitHub Container Registry (`ghcr.io/habeshacoder/amped_nestjs_backend`), generates GitHub Release notes, and executes gated deployment hooks.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
