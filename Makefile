.PHONY: install generate build test test-cov test-e2e typecheck verify

install:
	npm ci

generate:
	npx prisma generate

build:
	npm run build

test:
	npm test

test-cov:
	npm run test:cov

test-e2e:
	npm run test:e2e

test-e2e-local:
	docker compose -f docker-compose.test.yml up -d postgres-test
	npm run test:e2e

typecheck:
	npm run typecheck

verify:
	npm ci
	npx prisma generate
	npm run build
	npm test
