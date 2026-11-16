import pg from 'pg';
import { env } from './env.js';

// PostgreSQL (Neon in production). Every query uses $n parameters, never string-built SQL.
// Rows of type bigint/numeric are parsed as numbers; amounts here are whole rupees well within range.
pg.types.setTypeParser(20, (v) => Number(v));
pg.types.setTypeParser(1700, (v) => Number(v));

export const GIFT_CATEGORIES = ['electronics', 'fashion', 'lifestyle', 'home', 'experiences', 'other'];

const SCHEMA = env.DB_SCHEMA;
if (!/^[a-z_][a-z0-9_]{0,40}$/.test(SCHEMA)) throw new Error('DB_SCHEMA must be a simple lowercase identifier.');

// Neon's certificates are publicly trusted, so verify them fully (pg treats "require" the same
// today but will weaken it in v9; being explicit keeps today's behaviour).
const connectionString = env.DATABASE_URL.replace(/sslmode=(require|prefer|verify-ca)/, 'sslmode=verify-full');

// Neon's pooler (PgBouncer, transaction mode) rejects a search_path startup option and does not
// keep session SETs between transactions, so table names are schema-qualified in every statement.
const TABLES = 'weddings|couple_users|gifts|gift_reservations|dreams|dream_contributions|webhook_events';
const TABLE_RE = new RegExp(String.raw`\b(FROM|JOIN|INTO|UPDATE|EXISTS|REFERENCES|ON)\s+(${TABLES})\b`, 'g');
export const qualify = (sql) => sql.replace(TABLE_RE, `$1 ${SCHEMA}.$2`);

export const pool = new pg.Pool({
  connectionString,
  max: env.DB_POOL_MAX,
  // Opening a TLS connection to Neon costs far more than a query, so keep idle ones around.
  idleTimeoutMillis: 10 * 60_000,
  connectionTimeoutMillis: 20_000,
  keepAlive: true,
  // Neon requires TLS; its URLs carry sslmode=require, which pg honours.
});
pool.on('error', (err) => console.error('[db] idle client error', err.message));

// Failures while *acquiring* a connection (cold start, TLS handshake under a burst) happen before
// any SQL runs, so retrying them is always safe. Errors from a running statement are never retried.
export const isConnectError = (err) =>
  /timeout exceeded when trying to connect|connection timeout|ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(err?.message || '') &&
  !err?.code?.match?.(/^[0-9A-Z]{5}$/);

export async function query(text, params) {
  const sql = qualify(text);
  for (let attempt = 0; ; attempt++) {
    let client;
    try {
      client = await pool.connect();
    } catch (err) {
      if (attempt < 2 && isConnectError(err)) {
        await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
        continue;
      }
      throw err;
    }
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }
}
export const one = async (text, params) => (await query(text, params)).rows[0] || null;
export const many = async (text, params) => (await query(text, params)).rows;

export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn({ query: (text, params) => client.query(qualify(text), params) });
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Idempotent schema. Runs on start-up; safe to run any number of times.
const DDL = `
CREATE SCHEMA IF NOT EXISTS ${SCHEMA};

CREATE TABLE IF NOT EXISTS weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,60}$'),
  couple_names text NOT NULL CHECK (char_length(couple_names) <= 120),
  wedding_date timestamptz NOT NULL,
  theme text NOT NULL DEFAULT 'palace-emerald',
  gifts_enabled boolean NOT NULL DEFAULT true,
  dreams_enabled boolean NOT NULL DEFAULT true,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS couple_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE CHECK (email = lower(email) AND char_length(email) <= 254),
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner')),
  token_version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS couple_users_wedding ON couple_users(wedding_id);

CREATE TABLE IF NOT EXISTS gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 600),
  image text NOT NULL DEFAULT '',
  estimated_price integer NOT NULL DEFAULT 0 CHECK (estimated_price >= 0),
  purchase_url text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'other' CHECK (category IN (${GIFT_CATEGORIES.map((c) => `'${c}'`).join(',')})),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gifts_wedding_order ON gifts(wedding_id, display_order);

-- A reservation is "active" while reserved or received. The partial unique index means the
-- database itself refuses a second active reservation for the same gift, so two guests racing
-- for one gift can never both succeed. Releasing sets active = false and keeps the row as
-- history. Nothing expires automatically: there is no TTL or scheduled cleanup.
CREATE TABLE IF NOT EXISTS gift_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  gift_id uuid REFERENCES gifts(id) ON DELETE SET NULL,
  gift_name text NOT NULL,
  guest_name text NOT NULL CHECK (char_length(guest_name) BETWEEN 1 AND 80),
  guest_phone text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 500),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'received', 'released')),
  active boolean NOT NULL DEFAULT true,
  reserved_at timestamptz NOT NULL DEFAULT now(),
  received_at timestamptz,
  released_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (active = (status <> 'released'))
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_reservation_per_gift ON gift_reservations(gift_id) WHERE active;
CREATE INDEX IF NOT EXISTS reservations_wedding ON gift_reservations(wedding_id, reserved_at DESC);

CREATE TABLE IF NOT EXISTS dreams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9-]{2,60}$'),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  target_amount integer NOT NULL CHECK (target_amount > 0),
  offline_amount integer NOT NULL DEFAULT 0 CHECK (offline_amount >= 0),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wedding_id, slug)
);

-- payment_status: created (order opened) -> paid (verified by signature or webhook) | failed.
-- 'pledged' exists only in demo mode and never counts towards a dream's total.
CREATE TABLE IF NOT EXISTS dream_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  dream_id uuid NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  contributor_name text NOT NULL CHECK (char_length(contributor_name) BETWEEN 1 AND 80),
  message text NOT NULL DEFAULT '',
  amount integer NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR',
  payment_status text NOT NULL DEFAULT 'created' CHECK (payment_status IN ('created', 'paid', 'failed', 'pledged')),
  provider text NOT NULL CHECK (provider IN ('razorpay', 'demo')),
  order_id text UNIQUE,
  payment_reference text UNIQUE,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contributions_wedding ON dream_contributions(wedding_id, payment_status);

-- Webhook event ids already processed: a retried delivery is acknowledged, never re-applied.
CREATE TABLE IF NOT EXISTS webhook_events (
  event_id text PRIMARY KEY,
  type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

export async function connectDb() {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL (or NEON_DB) is not set.');
  const client = await pool.connect();
  try {
    await client.query(qualify(DDL));
  } finally {
    client.release();
  }
  // Warm a few connections up front so the first guests do not pay for the handshakes.
  const warm = await Promise.allSettled(Array.from({ length: Math.min(env.DB_POOL_MIN, env.DB_POOL_MAX) }, () => pool.connect()));
  for (const r of warm) if (r.status === 'fulfilled') r.value.release();
}

export async function dropSchema() {
  await pool.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
}

export const isUniqueViolation = (err) => err?.code === '23505';
