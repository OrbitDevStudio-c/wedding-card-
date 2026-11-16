// Test-only configuration. None of these are real credentials: the "Razorpay" here is a local
// fake (see fake-razorpay.js) and the database schema is a throwaway one.
export const TEST_ENV = {
  NODE_ENV: 'test',
  PORT: '4010',
  DB_SCHEMA: 'gifts_test',
  JWT_SECRET: 'playwright-only-secret-0123456789abcdef0123456789',
  RAZORPAY_KEY_ID: 'rzp_test_fake_key',
  RAZORPAY_KEY_SECRET: 'fake_key_secret_for_tests_only',
  RAZORPAY_WEBHOOK_SECRET: 'fake_webhook_secret_for_tests_only',
  RAZORPAY_API_BASE: 'http://127.0.0.1:4011',
  RATE_RESERVE: '100000',
  RATE_LOGIN: '100000',
  RATE_CONTRIBUTE: '100000',
};

export const SLUG = 'alica-rushil';
export const OTHER_SLUG = 'other-wedding';
export const COUPLE = { email: 'couple@test.local', password: 'correct horse battery staple' };
export const OTHER_COUPLE = { email: 'other@test.local', password: 'another long test password' };
