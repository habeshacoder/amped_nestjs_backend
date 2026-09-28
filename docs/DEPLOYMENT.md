# Deployment & CI/CD Documentation

This document describes the continuous integration, release automation, Docker container registry publishing, and production deployment pipeline for `amped_nestjs_backend`.

---

## 1. CI Pipeline Architecture (`.github/workflows/ci.yml`)

The continuous integration workflow triggers on every push and pull request targeting the `main` branch:

- **Security & Least-Privilege**: Global workflow permission is locked to `contents: read`. Stale runs are automatically cancelled via `concurrency`.
- **Quality Gates**:
  1. `lint`: Enforces ESLint standards and runs `npm audit --audit-level=high --omit=dev`.
  2. `format`: Verifies Prettier code formatting (`npm run format:check`).
  3. `duplication`: Runs `jscpd` copy-paste detector (`npm run dup`), enforcing `< 10%` threshold.
  4. `typecheck`: Runs `tsc --noEmit` across Node.js `20.x` and `22.x`.
  5. `test`: Runs Jest test suites with coverage threshold enforcement (`>= 70%` statements, branches, lines, functions) across Node.js `20.x` and `22.x`.
  6. `e2e-integration`: Boots PostgreSQL 16 container, runs migrations, and tests end-to-end flows.
  7. `migrations`: Checks schema drift between Prisma migrations and PostgreSQL schema (`prisma migrate diff`).
  8. `build`: Verifies `npm run build` after all checks and tests pass (`needs: [lint, format, typecheck, test, duplication]`).
  9. `docker-build`: Validates multi-stage Docker build without pushing (`push: false`) using Buildx.
  10. `deploy`: Optional continuous deployment step that dispatches to webhook on successful `main` branch merges.

---

## 2. Release & Container Publishing (`.github/workflows/release.yml`)

Triggered whenever a semantic version tag matching `v*` (e.g., `v1.3.0`, `v1.3.1`) is pushed.

### Pipeline Stages

1. **GitHub Release (`release`)**:
   - Generates release notes and tags from commit log using `softprops/action-gh-release`.
   - Permissions: `contents: write`.

2. **GHCR Docker Publishing (`docker-publish`)**:
   - Authenticates to GitHub Container Registry (`ghcr.io`) using `GITHUB_TOKEN`.
   - Extracts semantic version tags (`vX.Y.Z`, `vX.Y`, `latest`) via `docker/metadata-action`.
   - Builds multi-stage production image using Buildx and pushes to `ghcr.io/habeshacoder/amped_nestjs_backend`.
   - Permissions: `contents: read`, `packages: write`.

3. **Production Deployment (`deploy`)**:
   - Depends on `release` and `docker-publish`.
   - Dispatches a secure webhook to triggering deployment runners (e.g., Coolify, Render, Portainer, or Kubernetes).

---

## 3. Required Secrets & Configuration

To enable automated production deployments, configure these secrets in your repository settings (**Settings > Secrets and variables > Actions**):

| Secret | Purpose | Default / Fallback |
| :----- | :------ | :----------------- |
| `GITHUB_TOKEN` | Automatically supplied by GitHub Actions for GHCR authentication and release creation | Injected by GitHub Actions |
| `DEPLOY_HOOK_URL` | Webhook URL triggered after image publish to instruct hosting platform to pull and redeploy | If unset, the deployment step skips cleanly (`exit 0`) without failing the pipeline |

> **Note**: Never hardcode credentials into workflow files or source control. If `DEPLOY_HOOK_URL` is omitted, the release tag and GHCR container image are published successfully while leaving deployment triggering to manual approval.
