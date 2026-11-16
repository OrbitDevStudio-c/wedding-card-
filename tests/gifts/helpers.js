import crypto from 'node:crypto';
import { request } from '@playwright/test';
import { COUPLE, SLUG, TEST_ENV } from './env.js';

export const BASE = 'http://localhost:4173';
export const W = `/api/weddings/${SLUG}`;

export const uid = () => crypto.randomBytes(4).toString('hex');

// An API client signed in as a couple, sending the CSRF header like the dashboard does.
export async function coupleClient(creds = COUPLE) {
  const ctx = await request.newContext({ baseURL: BASE });
  const res = await ctx.post('/api/auth/login', { data: creds });
  if (!res.ok()) throw new Error(`login failed: ${res.status()}`);
  const { cookies } = await ctx.storageState();
  const csrf = cookies.find((c) => c.name === 'wg_csrf')?.value;
  const h = { 'x-csrf-token': csrf };
  return {
    ctx,
    get: (p) => ctx.get(p),
    post: (p, data) => ctx.post(p, { data, headers: h }),
    put: (p, data) => ctx.put(p, { data, headers: h }),
    del: (p) => ctx.delete(p, { headers: h }),
    dispose: () => ctx.dispose(),
  };
}

export async function createGift(client, overrides = {}) {
  const res = await client.post('/api/couple/gifts', {
    name: `Test gift ${uid()}`,
    description: 'A gift created by an automated test.',
    image: '/gifts/watch.svg',
    estimatedPrice: 4999,
    purchaseUrl: 'https://example.com/product',
    category: 'lifestyle',
    ...overrides,
  });
  if (res.status() !== 201) throw new Error(`createGift failed: ${res.status()} ${await res.text()}`);
  return (await res.json()).gift;
}

export async function createDream(client, overrides = {}) {
  const slug = `test-dream-${uid()}`;
  const res = await client.post('/api/couple/dreams', {
    title: `Test dream ${slug}`,
    slug,
    description: 'A dream created by an automated test.',
    image: '/gifts/dream-alps.svg',
    targetAmount: 100000,
    offlineAmount: 0,
    ...overrides,
  });
  if (res.status() !== 201) throw new Error(`createDream failed: ${res.status()} ${await res.text()}`);
  return (await res.json()).dream;
}

const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');
export const checkoutSignature = (orderId, paymentId) => hmac(TEST_ENV.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
export const webhookSignature = (raw) => hmac(TEST_ENV.RAZORPAY_WEBHOOK_SECRET, raw);

export function paymentCapturedEvent({ orderId, paymentId, amountPaise }) {
  return JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: paymentId, order_id: orderId, amount: amountPaise, status: 'captured' } } },
  });
}
