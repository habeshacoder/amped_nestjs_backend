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

All commit messages must adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<optional scope>): <short summary in lowercase imperative mood>

[optional body]

[optional footer]
```

### Allowed Types:
- `feat`: A new feature or endpoint
- `fix`: A bug fix
- `test`: Adding or correcting tests
- `docs`: Documentation changes only
- `style`: Changes that do not affect code meaning (formatting, whitespace)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Code changes that improve performance
- `ci`: Changes to CI configuration or scripts
- `chore`: Maintenance tasks, dependency updates, configuration adjustments

### Examples:
- `feat(channel): add pagination to channel material listings`
- `fix(auth): await refresh token update during logout`
- `test: add unit test suite for ChannelMaterialService`
- `chore: enforce jest coverage threshold`

---

## 3. Local Quality Verification (Pre-Commit Checks)

Before opening a pull request, verify all local quality gates pass cleanly:

```bash
# 1. Code formatting check
npm run format:check

# 2. ESLint analysis
npm run lint

# 3. TypeScript strict type checking
npm run typecheck

# 4. Unit test suite & coverage gate
npm run test:cov

# 5. E2E integration test suite
npm run test:e2e

# 6. Production build
npm run build
```

Every PR must maintain or increase the Jest test coverage thresholds specified in `package.json`.

---

## 4. Testing Guidelines

1. **Unit Tests**:
   - Every new service or business logic method must include comprehensive unit tests.
   - Use Jest mocks for external providers (e.g., `PrismaService`, `ConfigService`).
   - Test both success and error/rejection paths (e.g., `ForbiddenException`, `NotFoundException`).
2. **Deterministic Data**:
   - Never depend on live external network connections or specific database row states in unit tests.
   - Use realistic mock fixtures and avoid hardcoded real credentials or production secrets.

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
4. Request reviews from code owners before merging.
