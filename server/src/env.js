import path from 'node:path';
import { fileURLToPath } from 'node:url';

// All server configuration comes from environment variables. Nothing secret is ever hardcoded.
const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);
const int = (v, d) => (Number.isFinite(Number.parseInt(v, 10)) ? Number.parseInt(v, 10) : d);

const NODE_ENV = process.env.NODE_ENV || 'development';
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const env = {
  NODE_ENV,
  isProd: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
  PORT: int(process.env.PORT, 4000),
  // Neon/PostgreSQL connection string. NEON_DB is accepted as an alias.
  DATABASE_URL: process.env.DATABASE_URL || process.env.NEON_DB || '',
  // Postgres schema holding the tables; tests use their own so they never touch real data.
  DB_SCHEMA: process.env.DB_SCHEMA || 'wedding_gifts',
  DB_POOL_MAX: int(process.env.DB_POOL_MAX, 10),
  DB_POOL_MIN: int(process.env.DB_POOL_MIN, 4),
  JWT_SECRET: process.env.JWT_SECRET || '',
  SESSION_HOURS: int(process.env.SESSION_HOURS, 12),
  // Origins allowed to call the API cross-origin. Same-origin calls (through the /api proxy) need none.
  CORS_ORIGINS: list(process.env.CORS_ORIGINS),
  // Public site URL, used to build QR and share links.
  PUBLIC_SITE_URL: (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, ''),
  UPLOAD_DIR: path.resolve(serverRoot, process.env.UPLOAD_DIR || 'uploads'),
  TRUST_PROXY: int(process.env.TRUST_PROXY, 1),
  // Rate limits: requests per IP per 15 minutes.
  RATE_RESERVE: int(process.env.RATE_RESERVE, 10),
  RATE_LOGIN: int(process.env.RATE_LOGIN, 8),
  RATE_CONTRIBUTE: int(process.env.RATE_CONTRIBUTE, 10),
  // Payments (Razorpay). With no key id/secret the dreams run in clearly labelled demo mode.
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  RAZORPAY_API_BASE: (process.env.RAZORPAY_API_BASE || 'https://api.razorpay.com').replace(/\/$/, ''),
  MIN_CONTRIBUTION: int(process.env.MIN_CONTRIBUTION, 100),
  MAX_CONTRIBUTION: int(process.env.MAX_CONTRIBUTION, 500000),
};

export const paymentsEnabled = () => Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

export function assertEnv() {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    if (env.isProd) throw new Error('JWT_SECRET must be set to at least 32 random characters in production.');
    console.warn('[env] JWT_SECRET is missing or short; using an insecure development secret.');
    env.JWT_SECRET = 'dev-only-insecure-secret-change-me-0123456789';
  }
  if (env.isProd && paymentsEnabled() && !env.RAZORPAY_WEBHOOK_SECRET) {
    console.warn('[env] RAZORPAY_WEBHOOK_SECRET is not set; payments confirm only through checkout verification.');
  }
}
