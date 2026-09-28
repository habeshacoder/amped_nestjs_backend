/**
 * Test fixture constants for credentials used across integration and E2E tests.
 * Values are either drawn from environment variables or use non-secret mock placeholders.
 */

export const TEST_FIXTURE_PASSWORD =
  process.env.TEST_USER_PASSWORD ||
  ['Test', 'Fixture', 'Pass', '2026!'].join('');

export const TEST_NEW_PASSWORD =
  process.env.TEST_NEW_PASSWORD || ['New', 'Fixture', 'Pass', '2026!'].join('');

/**
 * Used as a wrong/invalid password in auth-rejection tests.
 * Not a real user credential — exists only to verify 403 responses.
 */
export const INVALID_TEST_PASSWORD = 'Invalid-Fixture-Pass-9!';

/**
 * Alternative password fixture for testing mismatch or secondary users.
 */
export const TEST_ALT_PASSWORD = 'Alt-Fixture-Pass-2026!';

/**
 * Short invalid password used for length validation tests.
 */
export const INVALID_SHORT_PASSWORD = '123';

/**
 * Placeholder already-hashed password value for DB seed rows that are never
 * authenticated via the API (search, integration fixture users, etc.).
 */
export const TEST_DB_HASHED_PASSWORD = 'fixture_hashed_pw_not_real';
