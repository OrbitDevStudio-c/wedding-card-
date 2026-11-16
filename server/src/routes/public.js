import { Router } from 'express';
import { isUniqueViolation, many, one, query } from '../db.js';
import { env, paymentsEnabled } from '../env.js';
import { createRazorpayOrder, markPaid, verifyCheckoutSignature } from '../lib/payments.js';
import { findWedding, paidTotals, publicDream, publicGift } from '../lib/queries.js';
import { HttpError, phoneRule, slug, uuid, validate } from '../lib/validate.js';
import { limiter } from '../middleware/limits.js';

export const publicRouter = Router();

const noStore = (_req, res, next) => {
  // Availability changes the moment someone reserves, so never serve a cached list.
  res.set('Cache-Control', 'no-store');
  next();
};

const honeypot = (body) => {
  // Hidden "website" field: people never see it, form-filling bots do.
  if (body && typeof body.website === 'string' && body.website.trim()) {
    throw new HttpError(400, 'invalid', 'Your request could not be processed.');
  }
};

publicRouter.get('/weddings/:slug', noStore, async (req, res) => {
  const w = await findWedding(req.params.slug);
  res.json({
    slug: w.slug,
    coupleNames: w.couple_names,
    weddingDate: w.wedding_date,
    giftsEnabled: w.gifts_enabled,
    dreamsEnabled: w.gifts_enabled && w.dreams_enabled,
    payments: paymentsEnabled()
      ? { mode: 'razorpay', keyId: env.RAZORPAY_KEY_ID, min: env.MIN_CONTRIBUTION, max: env.MAX_CONTRIBUTION }
      : { mode: 'demo', min: env.MIN_CONTRIBUTION, max: env.MAX_CONTRIBUTION },
  });
});

// Active gifts nobody has reserved. Reserved gifts are excluded in SQL, so neither their
// existence nor who reserved them ever reaches the browser.
publicRouter.get('/weddings/:slug/gifts', noStore, async (req, res) => {
  const w = await findWedding(req.params.slug, 'gifts');
  const gifts = await many(
    `SELECT g.* FROM gifts g
      WHERE g.wedding_id = $1 AND g.is_active
        AND NOT EXISTS (SELECT 1 FROM gift_reservations r WHERE r.gift_id = g.id AND r.active)
      ORDER BY g.display_order, g.created_at`,
    [w.id],
  );
  res.json({ gifts: gifts.map(publicGift) });
});

const reserveRules = {
  guestName: { type: 'text', required: true, min: 2, max: 80, message: 'Please enter your name.' },
  guestPhone: phoneRule,
  message: { type: 'text', max: 500, multiline: true, default: '', message: 'Please keep your message under 500 characters.' },
};

publicRouter.post('/weddings/:slug/gifts/:giftId/reservations', limiter('reserve'), async (req, res) => {
  honeypot(req.body);
  const w = await findWedding(req.params.slug, 'gifts');
  const giftId = uuid(req.params.giftId, 'gift');
  const data = validate(req.body, reserveRules);

  // The gift must exist, belong to this wedding and be switched on.
  const gift = await one('SELECT id, name, purchase_url, is_active FROM gifts WHERE id = $1 AND wedding_id = $2', [giftId, w.id]);
  if (!gift) throw new HttpError(404, 'not_found', 'That gift could not be found.');
  if (!gift.is_active) throw new HttpError(409, 'unavailable', 'This gift is no longer on the wishlist.');

  // The insert is the atomic step: the partial unique index on gift_id WHERE active lets
  // exactly one of any number of simultaneous requests succeed. The rest get 23505.
  let created;
  try {
    created = await one(
      `INSERT INTO gift_reservations (wedding_id, gift_id, gift_name, guest_name, guest_phone, message)
       SELECT $1, g.id, g.name, $3, $4, $5 FROM gifts g WHERE g.id = $2 AND g.wedding_id = $1 AND g.is_active
       RETURNING id`,
      [w.id, gift.id, data.guestName, data.guestPhone || '', data.message],
    );
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new HttpError(409, 'already_reserved', 'Another guest has just chosen this gift. Please pick another from the wishlist.');
    }
    throw err;
  }
  // Success only if a row was actually written (the gift may have been switched off meanwhile).
  if (!created) throw new HttpError(409, 'unavailable', 'This gift is no longer on the wishlist.');
  // Echo nothing private back: the guest already knows what they typed.
  res.status(201).json({ ok: true, gift: { id: gift.id, name: gift.name, purchaseUrl: gift.purchase_url } });
});

publicRouter.get('/weddings/:slug/dreams', noStore, async (req, res) => {
  const w = await findWedding(req.params.slug, 'dreams');
  const [dreams, totals] = await Promise.all([
    many('SELECT * FROM dreams WHERE wedding_id = $1 AND is_active ORDER BY display_order, created_at', [w.id]),
    paidTotals(w.id),
  ]);
  res.json({ dreams: dreams.map((d) => publicDream(d, totals)) });
});

async function findDream(w, rawSlug) {
  const dream = await one('SELECT * FROM dreams WHERE wedding_id = $1 AND slug = $2 AND is_active', [w.id, slug(rawSlug, 'dream')]);
  if (!dream) throw new HttpError(404, 'not_found', 'This dream could not be found.');
  return dream;
}

publicRouter.get('/weddings/:slug/dreams/:dreamSlug', noStore, async (req, res) => {
  const w = await findWedding(req.params.slug, 'dreams');
  const dream = await findDream(w, req.params.dreamSlug);
  res.json({ dream: publicDream(dream, await paidTotals(w.id)) });
});

publicRouter.post('/weddings/:slug/dreams/:dreamSlug/contributions', limiter('contribute'), async (req, res) => {
  honeypot(req.body);
  const w = await findWedding(req.params.slug, 'dreams');
  const dream = await findDream(w, req.params.dreamSlug);
  const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;
  const data = validate(req.body, {
    contributorName: { type: 'text', required: true, min: 2, max: 80, message: 'Please enter your name.' },
    message: { type: 'text', max: 500, multiline: true, default: '', message: 'Please keep your message under 500 characters.' },
    amount: {
      type: 'int',
      required: true,
      min: env.MIN_CONTRIBUTION,
      max: env.MAX_CONTRIBUTION,
      message: `Choose an amount between ${fmt(env.MIN_CONTRIBUTION)} and ${fmt(env.MAX_CONTRIBUTION)}.`,
    },
  });
  const insert = (provider, status) =>
    one(
      `INSERT INTO dream_contributions (wedding_id, dream_id, contributor_name, message, amount, provider, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [w.id, dream.id, data.contributorName, data.message, data.amount, provider, status],
    );

  if (!paymentsEnabled()) {
    // Demo mode: the couple sees the pledge, but no money moves and totals do not change.
    await insert('demo', 'pledged');
    return res.status(201).json({ mode: 'demo' });
  }

  const contribution = await insert('razorpay', 'created');
  try {
    const order = await createRazorpayOrder({
      amountRupees: data.amount,
      receipt: contribution.id.slice(0, 40),
      notes: { wedding: w.slug, dream: dream.slug },
    });
    await query('UPDATE dream_contributions SET order_id = $2, updated_at = now() WHERE id = $1', [contribution.id, order.id]);
    res.status(201).json({
      mode: 'razorpay',
      keyId: env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: w.couple_names,
      description: dream.title,
    });
  } catch (err) {
    await query('DELETE FROM dream_contributions WHERE id = $1', [contribution.id]);
    throw err;
  }
});

// Called by the browser after Razorpay Checkout succeeds. Only a valid server-side signature
// marks the contribution paid; the browser's word alone is never enough.
publicRouter.post('/weddings/:slug/contributions/verify', limiter('contribute'), async (req, res) => {
  await findWedding(req.params.slug, 'dreams');
  const b = req.body || {};
  if (![b.orderId, b.paymentId, b.signature].every((v) => typeof v === 'string' && v.length > 0 && v.length < 200)) {
    throw new HttpError(400, 'invalid', 'Missing payment details.');
  }
  if (!verifyCheckoutSignature({ orderId: b.orderId, paymentId: b.paymentId, signature: b.signature })) {
    throw new HttpError(400, 'invalid_signature', 'We could not verify this payment.');
  }
  const result = await markPaid({ orderId: b.orderId, paymentId: b.paymentId });
  if (result.status === 'unknown_order') throw new HttpError(404, 'not_found', 'This payment does not match a contribution.');
  res.json({ ok: true });
});
