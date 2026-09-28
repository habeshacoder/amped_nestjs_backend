# Contributing to AMPED Backend

Thank you for your interest in contributing to the AMPED NestJS Backend! We hold our codebase to rigorous engineering standards covering code quality, automated testing, security, and consistent commit discipline.

Please review this guide before submitting contributions.

---

## 1. Branching Strategy

- **`main`**: Protected production branch. Direct pushes to `main` are prohibited.
- All work should be developed on a dedicated feature or chore branch branched from `main`:
  - `feat/feature-name` for new user-facing functionality.
  - `fix/bug-description` for bug fixes.
  - `test/suite-name` for testing additions or improvements.
  - `chore/task-name` for tooling, maintenance, or dependency updates.
  - `docs/doc-topic` for documentation updates.

```bash
git checkout -b feat/my-new-feature
```

---

## 2. Commit Message Standards (Conventional Commits)

All commit messages must adhere strictly to the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short summary in lowercase imperative mood>

[optional body describing motivation and implementation details]

[optional footer(s), e.g., Closes #123, BREAKING CHANGE: description]
```

### Allowed Types:

- `feat`: A new feature or endpoint
- `fix`: A bug fix or defect resolution
- `test`: Adding missing tests or correcting existing test suites
- `docs`: Documentation updates or additions only
- `style`: Changes that do not affect code semantics (whitespace, formatting)
- `refactor`: Code reorganization that neither fixes a bug nor adds a feature
- `perf`: Performance optimizations
- `ci`: Changes to CI/CD workflows, build configurations, or deployment automation
- `chore`: Tooling, dependency maintenance, or housekeeping tasks

### Commit Rules:

1. **Imperative Mood**: Use lowercase imperative present tense for the header summary (e.g. `add pagination utility`, not `added` or `adds`).
2. **Scoping**: Use clear module or functional scopes (e.g., `auth`, `channel`, `material`, `deps`, `setup`, `security`).
3. **Focused Commits**: One logical change per commit.
4. **Tests Ship With The Code**: Every feature, fix, or refactor commit **must include its corresponding tests in the exact same commit**. Never defer tests to a follow-up commit. Commits are enforced locally via `commitlint` and husky pre-commit git hooks.

---

## 3. Standard Verification Gate

Before committing code or submitting a pull request, run the canonical verification gate locally. Every command must exit `0`:

```bash
# 1. Clean installation of pinned dependencies
npm ci

# 2. Static analysis and code linting (zero errors tolerated)
npm run lint

# 3. TypeScript compilation without emit (strict type check)
npm run typecheck

# 4. Complete unit test suite execution (all 62+ suites must pass)
npm test

# 5. Production bundle compilation and Prisma generation
npm run build
```

#### One-Liner Verification:

```bash
npm ci && npm run lint && npm run typecheck && npm test && npm run build
```

In addition, before opening a PR, ensure code formatting and duplication pass:

```bash
npm run format:check   # Verifies Prettier styling
npm run dup            # Verifies < 10% code duplication via jscpd
npm run test:cov       # Verifies all coverage thresholds (>= 70%) are satisfied
```

---

## 4. How to Add Tests

### 1. Unit Tests (`src/**/*.spec.ts`)

- **File Location & Naming**: Place spec files directly adjacent to the file being tested (e.g., `material.service.ts` → `material.service.spec.ts`).
- **Isolation & Mocking**: Unit tests must execute in complete isolation without connecting to external networks or live databases. Mock all external dependencies (`PrismaService`, `ConfigService`, external APIs):
  ```typescript
  const prismaMock = {
    material: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      MaterialService,
      { provide: PrismaService, useValue: prismaMock },
    ],
  }).compile();
  ```
- **Error Path Testing**: Always test domain exceptions alongside happy paths:
  - Assert that missing entities throw `NotFoundError`.
  - Assert that duplicate entries throw `ConflictError`.
  - Assert that invalid inputs or constraint violations throw `ValidationError`.
- **Coverage Requirement**: Ensure new code satisfies the `>= 70%` statements, branches, lines, and functions threshold enforced by `package.json`.

### 2. End-to-End Tests (`test/*.e2e-spec.ts`)

- **Location**: All integration test suites live in the `test/` directory.
- **Offline Hermetic Design**: Use `mockChapaService` via `.overrideProvider(ChapaService)` for payment flows. Run against ephemeral PostgreSQL via `docker-compose.test.yml`:
  ```bash
  npm run test:e2e:local
  ```
- **Dynamic Credentials**: Use non-secret environment variables (`TEST_FIXTURE_PASSWORD`, `TEST_NEW_PASSWORD`) rather than hardcoded literals.

---

## 5. Database Migration Discipline

1. **Immutability**: Applied migrations are strictly immutable once merged into `main`. Never edit, delete, or re-order applied migration files in `prisma/migrations`.
2. **New Migrations**: All schema modifications, constraints, or index additions must be introduced through a new, timestamped migration using:
   ```bash
   npm run migration:generate -- --name my_change_name
   ```
3. **Data Safety**:
   - Adding `NOT NULL`, `UNIQUE`, or `CHECK` constraints to populated tables must be accompanied by read-only verification queries to ensure no existing records violate the constraint.
   - Separate data backfills from structural schema alterations.
4. **Drift Verification**: Always run `npm run migration:check` before pushing your branch to verify that the committed migrations match `prisma/schema.prisma`.

---

## 6. Pull Request Process

1. Ensure all CI workflow checks pass in GitHub Actions.
2. Ensure PR titles follow Conventional Commits format (e.g. `feat(auth): support session revocation`).
3. Keep PRs focused on a single logical change or feature.
4. Request reviews from code owners before merging (see `.github/CODEOWNERS`).

---

## 7. Branch Protection Rules

To maintain production stability and auditability, the `main` branch is protected by the following repository rules:

1. **Require Pull Request Before Merging**: Direct pushes to `main` are strictly blocked. All code must enter via pull requests.
2. **Require Approvals**: Pull requests require at least 1 approving review from designated code owners specified in `.github/CODEOWNERS`.
3. **Require Status Checks to Pass**:
   - `lint` (ESLint analysis)
   - `format:check` (Prettier code styling)
   - `typecheck` (`tsc --noEmit`)
   - `unit-test (20.x)` & `unit-test (22.x)` (all unit tests + Jest coverage thresholds)
   - `e2e` (PostgreSQL service container smoke tests)
   - `audit` (`npm audit --omit=dev --audit-level=critical`)
   - `build` (NestJS production bundle compilation)
4. **Require Linear History**: Pull requests are merged using Squash & Merge or Rebase & Merge to preserve a clean, mineable git history.
5. **No Force Pushing**: Force pushes (`git push --force`) and branch deletions are disabled on `main`.
