import crypto from 'node:crypto';
import { isUniqueViolation, one, query } from '../db.js';
import { env, paymentsEnabled } from '../env.js';
import { HttpError } from './validate.js';

const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length || !/^[a-f0-9]+$/i.test(a)) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

// Creates a Razorpay order on the server so the amount cannot be changed in the browser.
export async function createRazorpayOrder({ amountRupees, receipt, notes }) {
  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
  let res;
  try {
    res = await fetch(`${env.RAZORPAY_API_BASE}/v1/orders`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountRupees * 100, currency: 'INR', receipt, notes }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new HttpError(502, 'payment_gateway', 'The payment service is unavailable. Please try again shortly.');
  }
  if (!res.ok) throw new HttpError(502, 'payment_gateway', 'The payment service is unavailable. Please try again shortly.');
  const order = await res.json();
  if (typeof order?.id !== 'string' || order.amount !== amountRupees * 100) {
    throw new HttpError(502, 'payment_gateway', 'The payment service returned an unexpected response.');
  }
  return order;
}

// Checkout success handler: Razorpay signs "order_id|payment_id" with the key secret.
export function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  if (!paymentsEnabled()) return false;
  return safeEqualHex(hmac(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`), signature);
}

// Webhooks: Razorpay signs the raw request body with the webhook secret.
export function verifyWebhookSignature(rawBody, signature) {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !Buffer.isBuffer(rawBody)) return false;
  return safeEqualHex(hmac(env.RAZORPAY_WEBHOOK_SECRET, rawBody), signature);
}

// Marks a contribution paid exactly once. The WHERE guard makes this idempotent: a second
// verification or a replayed webhook updates nothing.
export async function markPaid({ orderId, paymentId, amountPaise }) {
  const c = await one(`SELECT id, amount, payment_status FROM dream_contributions WHERE order_id = $1 AND provider = 'razorpay'`, [orderId]);
  if (!c) return { status: 'unknown_order' };
  if (c.payment_status === 'paid') return { status: 'already_paid' };
  if (amountPaise !== undefined && amountPaise !== c.amount * 100) return { status: 'amount_mismatch' };
  try {
    const updated = await one(
      `UPDATE dream_contributions SET payment_status = 'paid', payment_reference = $2, paid_at = now(), updated_at = now()
        WHERE id = $1 AND payment_status <> 'paid' RETURNING id`,
      [c.id, paymentId],
    );
    return { status: updated ? 'paid' : 'already_paid' };
  } catch (err) {
    if (isUniqueViolation(err)) return { status: 'already_paid' };
    throw err;
  }
}

export async function markFailed(orderId) {
  await query(
    `UPDATE dream_contributions SET payment_status = 'failed', updated_at = now()
      WHERE order_id = $1 AND provider = 'razorpay' AND payment_status = 'created'`,
    [orderId],
  );
}

// Records the event id first; a duplicate delivery hits the primary key and is skipped.
export async function claimWebhookEvent(eventId, type) {
  const row = await one('INSERT INTO webhook_events (event_id, type) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING event_id', [
    eventId,
    type || null,
  ]);
  return Boolean(row);
}
