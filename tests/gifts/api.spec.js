import { expect, request, test } from '@playwright/test';
import { OTHER_COUPLE, OTHER_SLUG, TEST_ENV } from './env.js';
import {
  BASE,
  W,
  checkoutSignature,
  coupleClient,
  createDream,
  createGift,
  paymentCapturedEvent,
  uid,
  webhookSignature,
} from './helpers.js';

// In order, on one worker: these tests share the seeded weddings.
test.describe.configure({ mode: 'default' });

let couple;
let other;
let anon;

test.beforeAll(async () => {
  couple = await coupleClient();
  other = await coupleClient(OTHER_COUPLE);
  anon = await request.newContext({ baseURL: BASE });
});

test.afterAll(async () => {
  await Promise.all([couple.dispose(), other.dispose(), anon.dispose()]);
});

const publicGifts = async () => (await (await anon.get(`${W}/gifts`)).json()).gifts;
const reserve = (giftId, data = { guestName: 'Aarav Shah' }) => anon.post(`${W}/gifts/${giftId}/reservations`, { data });

test.describe('public wishlist', () => {
  test('lists exactly the active, unreserved gifts with no private fields', async () => {
    const shown = await createGift(couple);
    const hidden = await createGift(couple, { isActive: false });
    const reserved = await createGift(couple);
    expect((await reserve(reserved.id)).status()).toBe(201);

    // UI tests in other projects add and reserve gifts concurrently, so compare against private
    // snapshots taken just before and after the public read.
    const available = async () =>
      new Set((await (await couple.get('/api/couple/gifts')).json()).gifts.filter((g) => g.isActive && !g.reservation).map((g) => g.id));
    const before = await available();
    const gifts = await publicGifts();
    const after = await available();
    const publicIds = new Set(gifts.map((g) => g.id));
    for (const id of publicIds) expect(before.has(id) || after.has(id), `public gift ${id} should be available`).toBe(true);
    for (const id of before) if (after.has(id)) expect(publicIds.has(id), `available gift ${id} should be public`).toBe(true);
    expect(gifts.some((g) => g.id === shown.id)).toBe(true);
    expect(gifts.some((g) => g.id === hidden.id)).toBe(false);
    expect(gifts.some((g) => g.id === reserved.id)).toBe(false);

    for (const g of gifts) {
      expect(Object.keys(g).sort()).toEqual(['category', 'description', 'estimatedPrice', 'id', 'image', 'name', 'purchaseUrl', 'translations']);
      expect(Object.keys(g.translations).every((l) => l === 'gu')).toBe(true);
    }
  });

  test('public responses never contain reservation details', async () => {
    const gift = await createGift(couple);
    const secret = `Secret Guest ${uid()}`;
    const res = await reserve(gift.id, { guestName: secret, guestPhone: '+91 98765 43210', message: `hidden note ${secret}` });
    expect(res.status()).toBe(201);
    const reply = await res.text();
    expect(reply).not.toContain('98765');
    expect(reply).not.toContain('hidden note');

    for (const path of [W, `${W}/gifts`, `${W}/dreams`]) {
      const body = await (await anon.get(path)).text();
      expect(body).not.toContain(secret);
      expect(body).not.toContain('98765');
      expect(body).not.toMatch(/guest|reserv/i);
    }
  });

  test('unknown wedding and malformed ids return 404', async () => {
    expect((await anon.get('/api/weddings/no-such-wedding/gifts')).status()).toBe(404);
    expect((await reserve('not-a-uuid')).status()).toBe(404);
    expect((await reserve('00000000-0000-4000-8000-000000000000')).status()).toBe(404);
  });
});

test.describe('reservations', () => {
  test('validates the guest name, phone and message', async () => {
    const gift = await createGift(couple);
    const bad = await reserve(gift.id, { guestName: ' ', guestPhone: 'call me', message: 'x'.repeat(501) });
    expect(bad.status()).toBe(400);
    const { fields } = await bad.json();
    expect(Object.keys(fields).sort()).toEqual(['guestName', 'guestPhone', 'message']);
    // Still available after a rejected attempt
    expect((await publicGifts()).some((g) => g.id === gift.id)).toBe(true);
  });

  test('a successful reservation removes the gift, and a second guest is turned away', async () => {
    const gift = await createGift(couple);
    expect((await reserve(gift.id, { guestName: 'Priya Patel', guestPhone: '9876543210', message: 'With love' })).status()).toBe(201);
    expect((await publicGifts()).some((g) => g.id === gift.id)).toBe(false);

    const second = await reserve(gift.id, { guestName: 'Someone Else' });
    expect(second.status()).toBe(409);
    expect((await second.json()).error).toBe('already_reserved');
    // The same guest cannot reserve it twice either
    expect((await reserve(gift.id, { guestName: 'Priya Patel' })).status()).toBe(409);

    const mine = (await (await couple.get('/api/couple/reservations?status=active')).json()).reservations.filter(
      (r) => r.giftId === gift.id,
    );
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ guestName: 'Priya Patel', guestPhone: '9876543210', message: 'With love', status: 'reserved' });
  });

  test('simultaneous reservations: exactly one succeeds', async () => {
    const gift = await createGift(couple);
    const results = await Promise.all(
      Array.from({ length: 15 }, (_, i) => reserve(gift.id, { guestName: `Racer ${i}` }).then((r) => r.status())),
    );
    expect(results.filter((s) => s === 201)).toHaveLength(1);
    expect(results.filter((s) => s === 409)).toHaveLength(14);
    const active = (await (await couple.get('/api/couple/reservations?status=active')).json()).reservations;
    expect(active.filter((r) => r.giftId === gift.id)).toHaveLength(1);
  });

  test('the database enforces one active reservation per gift and has no expiry mechanism', async () => {
    Object.assign(process.env, TEST_ENV);
    const { many, pool } = await import('../../server/src/db.js');
    try {
      const indexes = await many(
        `SELECT indexdef FROM pg_indexes WHERE schemaname = $1 AND tablename = 'gift_reservations'`,
        [TEST_ENV.DB_SCHEMA],
      );
      expect(indexes.map((i) => i.indexdef).join('\n')).toMatch(/UNIQUE INDEX one_active_reservation_per_gift .*\(gift_id\) WHERE active/);
      const cols = await many(`SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'gift_reservations'`, [
        TEST_ENV.DB_SCHEMA,
      ]);
      expect(cols.map((c) => c.column_name)).not.toContain('expires_at');
      const triggers = await many(`SELECT 1 FROM information_schema.triggers WHERE event_object_schema = $1`, [TEST_ENV.DB_SCHEMA]);
      expect(triggers).toHaveLength(0);
    } finally {
      await pool.end();
    }
  });

  test('reservations stay active until the couple releases them; released gifts return', async () => {
    const gift = await createGift(couple);
    expect((await reserve(gift.id)).status()).toBe(201);
    await new Promise((r) => setTimeout(r, 1500));
    const active = (await (await couple.get('/api/couple/reservations?status=active')).json()).reservations;
    const r = active.find((x) => x.giftId === gift.id);
    expect(r.status).toBe('reserved');

    const received = await couple.post(`/api/couple/reservations/${r.id}/mark-received`);
    expect((await received.json()).reservation.status).toBe('received');
    expect((await publicGifts()).some((g) => g.id === gift.id)).toBe(false);

    const released = await couple.post(`/api/couple/reservations/${r.id}/release`);
    expect(released.status()).toBe(200);
    expect((await released.json()).reservation.status).toBe('released');
    expect((await publicGifts()).some((g) => g.id === gift.id)).toBe(true);
    // A new guest can now reserve it, and the old reservation stays as history
    expect((await reserve(gift.id, { guestName: 'Second Guest' })).status()).toBe(201);
    const all = (await (await couple.get('/api/couple/reservations')).json()).reservations.filter((x) => x.giftId === gift.id);
    expect(all.map((x) => x.status).sort()).toEqual(['released', 'reserved']);
  });

  test('a hidden gift cannot be reserved', async () => {
    const gift = await createGift(couple, { isActive: false });
    expect((await reserve(gift.id)).status()).toBe(409);
  });

  test('bots filling the honeypot are rejected', async () => {
    const gift = await createGift(couple);
    expect((await reserve(gift.id, { guestName: 'Bot', website: 'http://spam.example' })).status()).toBe(400);
    expect((await publicGifts()).some((g) => g.id === gift.id)).toBe(true);
  });
});

test.describe('couple authentication and isolation', () => {
  test('private endpoints reject anonymous requests', async () => {
    for (const p of ['/api/couple/me', '/api/couple/dashboard', '/api/couple/gifts', '/api/couple/reservations', '/api/couple/contributions']) {
      expect((await anon.get(p)).status(), p).toBe(401);
    }
    expect((await anon.post('/api/couple/gifts', { data: { name: 'x' } })).status()).toBe(401);
  });

  test('wrong password and operator injection are refused', async () => {
    expect((await anon.post('/api/auth/login', { data: { email: 'couple@test.local', password: 'wrong' } })).status()).toBe(401);
    expect((await anon.post('/api/auth/login', { data: { email: { $gt: '' }, password: { $gt: '' } } })).status()).toBe(400);
  });

  test('a forged session cookie is refused', async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { cookie: 'wg_session=eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.' },
    });
    expect((await ctx.get('/api/couple/dashboard')).status()).toBe(401);
    await ctx.dispose();
  });

  test('state-changing requests need the CSRF token', async () => {
    const res = await couple.ctx.post('/api/couple/gifts', { data: { name: 'No CSRF header' } });
    expect(res.status()).toBe(403);
  });

  test("another wedding's couple cannot see or change these reservations", async () => {
    const gift = await createGift(couple);
    const guest = `Isolated Guest ${uid()}`;
    await reserve(gift.id, { guestName: guest });
    const mine = (await (await couple.get('/api/couple/reservations')).json()).reservations.find((r) => r.giftId === gift.id);

    const theirs = await (await other.get('/api/couple/reservations')).text();
    expect(theirs).not.toContain(guest);
    expect((await (await other.get('/api/couple/gifts')).text())).not.toContain(gift.id);
    expect((await other.post(`/api/couple/reservations/${mine.id}/release`)).status()).toBe(404);
    expect((await other.put(`/api/couple/gifts/${gift.id}`, { name: 'Hijacked' })).status()).toBe(404);
    expect((await other.del(`/api/couple/gifts/${gift.id}`)).status()).toBe(404);
    expect((await (await other.get('/api/couple/me')).json()).wedding.slug).toBe(OTHER_SLUG);
    // Still intact for the real couple
    const after = (await (await couple.get('/api/couple/reservations?status=active')).json()).reservations.find((r) => r.id === mine.id);
    expect(after.guestName).toBe(guest);
  });
});

test.describe('wishlist management', () => {
  test('add, edit, reorder, hide and delete gifts', async () => {
    const a = await createGift(couple, { name: `Alpha ${uid()}` });
    const b = await createGift(couple, { name: `Beta ${uid()}` });

    const edited = await couple.put(`/api/couple/gifts/${a.id}`, { name: 'Renamed gift', estimatedPrice: 1234, category: 'home' });
    expect((await edited.json()).gift).toMatchObject({ name: 'Renamed gift', estimatedPrice: 1234, category: 'home' });

    const ids = (await (await couple.get('/api/couple/gifts')).json()).gifts.map((g) => g.id);
    const swapped = ids.filter((id) => id !== b.id);
    swapped.splice(ids.indexOf(a.id), 0, b.id);
    const ordered = (await (await couple.put('/api/couple/gifts/order', { ids: swapped })).json()).gifts.map((g) => g.id);
    expect(ordered.indexOf(b.id)).toBeLessThan(ordered.indexOf(a.id));

    await couple.put(`/api/couple/gifts/${b.id}`, { isActive: false });
    expect((await publicGifts()).some((g) => g.id === b.id)).toBe(false);

    expect((await couple.del(`/api/couple/gifts/${b.id}`)).status()).toBe(200);
    expect((await (await couple.get('/api/couple/gifts')).json()).gifts.some((g) => g.id === b.id)).toBe(false);
  });

  test('rejects unsafe links and bad values', async () => {
    const res = await couple.post('/api/couple/gifts', { name: 'Bad', purchaseUrl: 'javascript:alert(1)', image: 'data:image/png;base64,xx', estimatedPrice: -5 });
    expect(res.status()).toBe(400);
    expect(Object.keys((await res.json()).fields).sort()).toEqual(['estimatedPrice', 'image', 'purchaseUrl']);
  });

  test('a reserved gift cannot be deleted until released', async () => {
    const gift = await createGift(couple);
    await reserve(gift.id);
    expect((await couple.del(`/api/couple/gifts/${gift.id}`)).status()).toBe(409);
  });

  test('image uploads are re-encoded, and non-images are refused', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    const headers = { 'x-csrf-token': (await couple.ctx.storageState()).cookies.find((c) => c.name === 'wg_csrf').value };
    const ok = await couple.ctx.post('/api/couple/uploads', { headers, multipart: { image: { name: 'a.png', mimeType: 'image/png', buffer: png } } });
    expect(ok.status()).toBe(201);
    const { url } = await ok.json();
    expect(url).toMatch(/^\/api\/uploads\/[0-9a-f-]+\/[0-9a-f-]+\.webp$/);
    const img = await anon.get(url);
    expect(img.headers()['content-type']).toContain('image/webp');

    const fake = await couple.ctx.post('/api/couple/uploads', {
      headers,
      multipart: { image: { name: 'x.png', mimeType: 'image/png', buffer: Buffer.from('<script>alert(1)</script>') } },
    });
    expect(fake.status()).toBe(400);
  });
});

test.describe('dreams and payments', () => {
  const total = async (slug) => (await (await anon.get(`${W}/dreams/${slug}`)).json()).dream.raisedAmount;
  const contribute = (slug, data) => anon.post(`${W}/dreams/${slug}/contributions`, { data });

  test('dreams list and detail pages work; unknown dreams 404', async () => {
    const list = (await (await anon.get(`${W}/dreams`)).json()).dreams;
    const swiss = list.find((d) => d.slug === 'switzerland-honeymoon');
    expect(swiss).toMatchObject({ targetAmount: 200000, raisedAmount: 85000, progress: 42.5 });
    expect((await anon.get(`${W}/dreams/switzerland-honeymoon`)).status()).toBe(200);
    expect((await anon.get(`${W}/dreams/not-a-dream`)).status()).toBe(404);
  });

  test('contribution validation', async () => {
    const dream = await createDream(couple);
    const res = await contribute(dream.slug, { contributorName: '', amount: 5 });
    expect(res.status()).toBe(400);
    expect(Object.keys((await res.json()).fields).sort()).toEqual(['amount', 'contributorName']);
    expect((await contribute(dream.slug, { contributorName: 'A Guest', amount: '1e9' })).status()).toBe(400);
  });

  test('an order alone, or a forged payment, never increases the total', async () => {
    const dream = await createDream(couple);
    const order = await (await contribute(dream.slug, { contributorName: 'Forger', amount: 5000 })).json();
    expect(order).toMatchObject({ mode: 'razorpay', amount: 500000 });
    expect(await total(dream.slug)).toBe(0);

    const forged = await anon.post(`${W}/contributions/verify`, {
      data: { orderId: order.orderId, paymentId: 'pay_forged', signature: 'a'.repeat(64) },
    });
    expect(forged.status()).toBe(400);

    const raw = paymentCapturedEvent({ orderId: order.orderId, paymentId: 'pay_forged', amountPaise: 500000 });
    const hook = await anon.post('/api/payments/razorpay/webhook', {
      headers: { 'content-type': 'application/json', 'x-razorpay-signature': 'b'.repeat(64), 'x-razorpay-event-id': `evt_${uid()}` },
      data: raw,
    });
    expect(hook.status()).toBe(400);
    expect(await total(dream.slug)).toBe(0);
  });

  test('a verified checkout payment counts once', async () => {
    const dream = await createDream(couple);
    const order = await (await contribute(dream.slug, { contributorName: 'Checkout Guest', amount: 2100, message: 'Enjoy!' })).json();
    const paymentId = `pay_${uid()}`;
    const data = { orderId: order.orderId, paymentId, signature: checkoutSignature(order.orderId, paymentId) };
    expect((await anon.post(`${W}/contributions/verify`, { data })).status()).toBe(200);
    expect((await anon.post(`${W}/contributions/verify`, { data })).status()).toBe(200);
    expect(await total(dream.slug)).toBe(2100);

    const rows = (await (await couple.get('/api/couple/contributions')).json()).contributions.filter((c) => c.paymentReference === paymentId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ contributorName: 'Checkout Guest', message: 'Enjoy!', amount: 2100, paymentStatus: 'paid' });
  });

  test('verified webhooks update totals, and duplicate deliveries are ignored', async () => {
    const dream = await createDream(couple);
    const order = await (await contribute(dream.slug, { contributorName: 'Webhook Guest', amount: 5100 })).json();
    const paymentId = `pay_${uid()}`;
    const raw = paymentCapturedEvent({ orderId: order.orderId, paymentId, amountPaise: 510000 });
    const send = (eventId) =>
      anon.post('/api/payments/razorpay/webhook', {
        headers: { 'content-type': 'application/json', 'x-razorpay-signature': webhookSignature(raw), 'x-razorpay-event-id': eventId },
        data: raw,
      });
    const eventId = `evt_${uid()}`;
    expect(await (await send(eventId)).json()).toMatchObject({ ok: true, result: 'paid' });
    expect(await (await send(eventId)).json()).toMatchObject({ ok: true, duplicate: true });
    // Razorpay can also send order.paid etc. for the same payment under a new event id
    expect(await (await send(`evt_${uid()}`)).json()).toMatchObject({ ok: true, result: 'already_paid' });
    expect(await total(dream.slug)).toBe(5100);
  });

  test('a webhook whose amount does not match the order is not applied', async () => {
    const dream = await createDream(couple);
    const order = await (await contribute(dream.slug, { contributorName: 'Mismatch', amount: 1100 })).json();
    const raw = paymentCapturedEvent({ orderId: order.orderId, paymentId: `pay_${uid()}`, amountPaise: 100 });
    const res = await anon.post('/api/payments/razorpay/webhook', {
      headers: { 'content-type': 'application/json', 'x-razorpay-signature': webhookSignature(raw), 'x-razorpay-event-id': `evt_${uid()}` },
      data: raw,
    });
    expect((await res.json()).result).toBe('amount_mismatch');
    expect(await total(dream.slug)).toBe(0);
  });

  test('a dream with verified payments cannot be deleted', async () => {
    const dream = await createDream(couple);
    const order = await (await contribute(dream.slug, { contributorName: 'Keeper', amount: 1100 })).json();
    const paymentId = `pay_${uid()}`;
    await anon.post(`${W}/contributions/verify`, { data: { orderId: order.orderId, paymentId, signature: checkoutSignature(order.orderId, paymentId) } });
    expect((await couple.del(`/api/couple/dreams/${dream.id}`)).status()).toBe(409);
    const empty = await createDream(couple);
    expect((await couple.del(`/api/couple/dreams/${empty.id}`)).status()).toBe(200);
  });

  test('gifts and dreams are separate: paying never touches reservations', async () => {
    const free = await createGift(couple);
    const taken = await createGift(couple);
    await reserve(taken.id, { guestName: 'Gift Guest' });
    const dream = await createDream(couple);
    const order = await (await contribute(dream.slug, { contributorName: 'Separate', amount: 1100 })).json();
    const paymentId = `pay_${uid()}`;
    await anon.post(`${W}/contributions/verify`, { data: { orderId: order.orderId, paymentId, signature: checkoutSignature(order.orderId, paymentId) } });
    const gifts = (await (await couple.get('/api/couple/gifts')).json()).gifts;
    expect(gifts.find((g) => g.id === free.id).reservation).toBeNull();
    expect(gifts.find((g) => g.id === taken.id).reservation.guestName).toBe('Gift Guest');
    expect(await total(dream.slug)).toBe(1100);
  });
});
