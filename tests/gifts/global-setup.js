import http from 'node:http';
import { COUPLE, OTHER_COUPLE, OTHER_SLUG, SLUG, TEST_ENV } from './env.js';

// Runs once before all tests: resets the throwaway schema's data, seeds two weddings (to prove
// isolation between couples) and starts a fake Razorpay order API for the payment tests.
export default async function globalSetup() {
  Object.assign(process.env, TEST_ENV);
  if (!process.env.DATABASE_URL && !process.env.NEON_DB) {
    process.loadEnvFile?.('.env');
  }
  const { connectDb, pool, query } = await import('../../server/src/db.js');
  const { seedWedding } = await import('../../server/scripts/seed.js');
  await connectDb();
  await query('DELETE FROM webhook_events');
  await seedWedding({ slug: SLUG, coupleNames: 'Alica & Rushil', weddingDate: '2027-02-13T10:30:00+05:30', ...COUPLE, reset: true });
  await seedWedding({
    slug: OTHER_SLUG,
    coupleNames: 'Meera & Kabir',
    weddingDate: '2027-03-01T10:00:00+05:30',
    ...OTHER_COUPLE,
    reset: true,
  });
  await pool.end();

  const fake = startFakeRazorpay(Number(new URL(TEST_ENV.RAZORPAY_API_BASE).port));
  return () => new Promise((resolve) => fake.close(resolve));
}

// Minimal stand-in for POST /v1/orders. Signatures are still checked by the real server code.
function startFakeRazorpay(port) {
  let n = 0;
  const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/v1/orders') {
      res.writeHead(404).end();
      return;
    }
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const { amount, currency } = JSON.parse(body);
      n += 1;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id: `order_test_${Date.now()}_${n}`, amount, currency, status: 'created' }));
    });
  });
  server.listen(port, '127.0.0.1');
  return server;
}
