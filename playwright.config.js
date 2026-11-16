import { defineConfig } from '@playwright/test';
import { TEST_ENV } from './tests/gifts/env.js';

const viewports = [
  { name: 'mobile-360', width: 360, height: 740, mobile: true },
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'tablet-768', width: 768, height: 1024, mobile: true },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

// Extra sizes for the gifts pages only, so the full invitation suite keeps its current runtime.
const giftViewports = [
  { name: 'mobile-320', width: 320, height: 640, mobile: true },
  { name: 'mobile-430', width: 430, height: 932, mobile: true },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];

const project = ({ name, width, height, mobile }, extra = {}) => ({
  name,
  use: { viewport: { width, height }, hasTouch: Boolean(mobile), deviceScaleFactor: 1 },
  ...extra,
});

export default defineConfig({
  testDir: 'tests',
  timeout: 90_000,
  // Generous: the gifts API talks to a remote Postgres (Neon) during tests.
  expect: { timeout: 30_000 },
  fullyParallel: true,
  workers: 4,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './tests/gifts/global-setup.js',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    browserName: 'chromium',
  },
  projects: [
    // API, security, concurrency and payment tests: viewport-independent, run once.
    { name: 'api', testMatch: /gifts\/api\.spec\.js/ },
    ...viewports.map((v) => project(v, { testIgnore: /gifts\/api\.spec\.js/ })),
    ...giftViewports.map((v) => project(v, { testMatch: /gifts\/ui\.spec\.js/ })),
  ],
  webServer: [
    {
      // Gifts API against an isolated Postgres schema, a fake Razorpay gateway and test-only secrets.
      command: 'node --env-file-if-exists=../.env src/index.js',
      cwd: 'server',
      url: `http://127.0.0.1:${TEST_ENV.PORT}/api/health`,
      env: TEST_ENV,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm run build && npm run preview',
      url: 'http://localhost:4173',
      env: { API_PROXY_TARGET: `http://127.0.0.1:${TEST_ENV.PORT}` },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
