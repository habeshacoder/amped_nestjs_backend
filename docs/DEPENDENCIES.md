# Dependency Governance & Overrides Rationale

This document explains the purpose and necessity of each dependency override configured in `package.json`. Overrides are audited periodically to patch transitive vulnerabilities and resolve peer-dependency conflicts while maintaining runtime stability.

---

## Overrides Registry

### 1. `chapa-nestjs`
- **Specification**:
  ```json
  "chapa-nestjs": {
    "@nestjs/common": "$@nestjs/common",
    "@nestjs/axios": "^3.0.0"
  }
  ```
- **Rationale**: `chapa-nestjs` targets legacy NestJS v9 and `@nestjs/axios` v1. This override forces it to resolve the root `@nestjs/common` (v10.x) and compatible `@nestjs/axios` (v3.x), eliminating duplicate module instantiation and peer-dependency installation failures.

### 2. `body-parser` (`^1.20.6`)
- **Impacted Package**: `@nestjs/platform-express` -> `express`
- **Rationale**: Patches URL-encoded parsing denial-of-service vulnerabilities (CVE-2024-45590) in transitive express middleware.

### 3. `lodash` (`^4.18.1`)
- **Impacted Packages**: `@nestjs/config`, `@nestjs/swagger`, `inquirer`
- **Rationale**: Mitigates prototype pollution vulnerabilities in older transitive lodash versions.

### 4. `js-yaml` (`^4.1.0`)
- **Impacted Packages**: `@nestjs/swagger`, `eslint`, `cosmiconfig`
- **Rationale**: Ensures transitive YAML parsers in Swagger documentation generation and linting tooling are secure against prototype pollution.

### 5. `multer` (`^1.4.5-lts.1`)
- **Impacted Package**: `@nestjs/platform-express`
- **Rationale**: Enforces LTS-patched release of Multer across file upload handling middleware.

### 6. `tar` (`^7.5.22`)
- **Impacted Package**: Transitive CLI packaging utilities (`@mapbox/node-pre-gyp`)
- **Rationale**: Resolves high-severity arbitrary file overwrite and symlink path-traversal CVEs in legacy tar packages.

### 7. `smol-toml` (`^1.9.0`)
- **Impacted Package**: Transitive CLI configuration parsers (`@vercel/container`)
- **Rationale**: Addresses prototype pollution and uncontrolled recursion during TOML parsing.

### 8. `tmp` (`^0.2.7`)
- **Impacted Package**: `prisma-dbml-generator` -> `@prisma/internals`
- **Rationale**: Fixes insecure temporary file creation permissions in DBML schema generation tooling.

### 9. `picomatch` (`^4.0.4`)
- **Impacted Packages**: `@nestjs/cli`, `chokidar`, `lint-staged`, `jest`
- **Rationale**: Patches Regular Expression Denial of Service (ReDoS) vulnerabilities in transitive glob matching utilities.

### 10. `webpack` (`^5.105.0`)
- **Impacted Package**: `@nestjs/cli` build tooling
- **Rationale**: Resolves DOM clobbering and ReDoS vulnerabilities in NestJS CLI compilation pipelines.

### 11. `deepmerge-ts` (`^8.0.2`)
- **Impacted Package**: `@prisma/config`
- **Rationale**: Prevents prototype pollution in transitive object-merging libraries used during Prisma schema loading.

---

## Maintenance & Removal Criteria

An override is eligible for removal when:
1. The upstream parent package releases a version bumping its dependency requirement.
2. `npm audit --audit-level=high --omit=dev` remains 100% clean without the override.
3. The full verification gate (`npm ci && npm run build && npm test`) exits with code 0.
