# AMPED NestJS Backend

[![CI](https://github.com/habeshacoder/amped_nestjs_backend/actions/workflows/ci.yml/badge.svg)](https://github.com/habeshacoder/amped_nestjs_backend/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AMPED is a robust backend REST API built with [NestJS](https://nestjs.com/) and [Prisma](https://www.prisma.io/), powering digital publishing, media streaming, channel subscriptions, and content monetization. It supports publications, audiobooks, podcasts, user profiles, creator channels, subscription plans, and secure payment processing via the Chapa payment gateway.

---

## Architecture Overview

- **Framework**: NestJS (TypeScript, modular service-oriented architecture)
- **Database & ORM**: PostgreSQL via Prisma ORM
- **Authentication**: JWT access tokens + refresh tokens with Passport & Argon2 password hashing
- **Payment Processing**: Chapa Payment Gateway integration with secure webhook verification
- **File Storage**: Local Multer file storage pipeline for materials, covers, and previews
- **Code Quality**: ESLint, Prettier, TypeScript strict type checking, Jest unit & E2E integration test suites

---

## Prerequisites Matrix

| Requirement | Supported Version | Notes |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` (Active LTS / v20 or v22) | Recommended: use `.nvmrc` (`nvm use`) |
| **npm** | `>= 10.0.0` | Included with Node LTS |
| **PostgreSQL** | `>= 14.0` | Required for migrations and relational persistence |
| **Git** | `>= 2.30.0` | For version control and branch management |

---

## Quick Start & Setup

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
Copy the template configuration and fill in the required credentials:
```bash
cp .env.example .env
```

### 5. Start Local PostgreSQL via Docker Compose
```bash
docker compose up -d
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

# Production build and run
npm run build
npm run start:prod
```

---

## Database Architecture & Migration Workflow

See [docs/data-model.md](docs/data-model.md) for the complete Mermaid Entity-Relationship Diagram (ERD), Data Dictionary, and Data Flow architecture.

### Migration Commands
- **Run migrations**: `npm run migration:run` (`prisma migrate deploy`)
- **Inspect migration status**: `npm run migration:status` (`prisma migrate status`)
- **Generate a new migration**: `npm run migration:generate` (`prisma migrate dev --create-only`)
- **Schema drift check**: `npm run migration:check` (diffs committed migrations against the Prisma schema datamodel)

> **Important**: Never run migrations or data-changing commands against a shared, staging, or production database without prior review. Applied migrations are immutable once merged—always author a new timestamped migration file.

---

## Environment Variables Reference

| Variable | Type | Required | Default / Example | Description |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | `string` | No | `development` | Application environment (`development`, `test`, `production`) |
| `PORT` | `number` | No | `3007` | HTTP server port |
| `DATABASE_URL` | `string` | **Yes** | `postgresql://user:pass@localhost:5432/amped?schema=public` | PostgreSQL connection string |
| `JWT_SECRET` | `string` | **Yes** | `min-16-char-secret-key` | Secret key used to sign access JWTs |
| `JWT_REFRESH_SECRET` | `string` | **Yes** | `min-16-char-refresh-secret-key` | Secret key used to sign refresh JWTs |
| `CHAPA_SECRET_KEY` | `string` | No | `CHASECK_TEST-...` | Chapa Payment Gateway API secret key |
| `CHAPA_WEBHOOK_HASH_KEY` | `string` | No | `webhook-secret-hash` | Secret hash for Chapa webhook verification |
| `CHAPA_WEBHOOK_URL` | `string` | No | `https://api.example.com/payment/webhook` | Webhook callback URL registered with Chapa |

---

## Available Scripts & Quality Gates

### Code Quality
```bash
# Check code formatting with Prettier
npm run format:check

# Format files automatically
npm run format

# Run ESLint analysis
npm run lint

# Run TypeScript typecheck without emitting files
npm run typecheck
```

### Testing
```bash
# Run all unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage report and threshold gate
npm run test:cov

# Run end-to-end integration tests
npm run test:e2e
```

---

## Project Structure

```
amped_nestjs_backend/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI pipeline (lint, format, typecheck, test, build)
├── prisma/
│   ├── schema.prisma            # Relational database schema
│   └── migrations/              # Database migration history
├── src/
│   ├── auth/                    # Authentication, JWT strategies, guards, decorators
│   ├── channel/                 # Channel management & creator channels
│   ├── channel-material/        # Channel digital materials (books, audio, podcasts)
│   ├── channel-purchase/        # Channel monetization & Chapa webhooks
│   ├── common/                  # Shared utilities, filters, and middleware
│   ├── favorite/                # User favorites management
│   ├── material/                # Direct digital materials
│   ├── material-purchase/       # Material purchases & Chapa webhooks
│   ├── prisma/                  # Prisma service provider
│   ├── profiles/                # User profile management
│   ├── rating/                  # Material & content ratings
│   ├── replays/                 # Video/audio replay sessions
│   ├── reports/                 # Content violation reports
│   ├── search/                  # Full-text / catalog search
│   ├── seller-profiles/         # Creator/seller store profiles
│   ├── subscribed-user/         # Active channel subscribers
│   ├── subscription-plan/       # Subscription tier management
│   ├── user/                    # User accounts & identity
│   ├── app.module.ts            # Root module & config validation schema
│   └── main.ts                  # Application bootstrap
├── test/
│   ├── app.e2e-spec.ts          # End-to-end integration suite
│   └── jest-e2e.json            # Jest E2E configuration
├── .editorconfig                # Consistent editor configuration
├── .env.example                 # Environment variables template
├── .nvmrc                       # Node version lockfile
└── package.json                 # Dependencies, scripts, and coverage thresholds
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
