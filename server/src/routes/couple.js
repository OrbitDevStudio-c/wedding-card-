import { Router } from 'express';
import { isUniqueViolation, many, one, query, tx } from '../db.js';
import { paymentsEnabled } from '../env.js';
import { saveImage, upload } from '../lib/images.js';
import { paidTotals, privateDream } from '../lib/queries.js';
import { HttpError, dreamRules, giftRules, isUuid, slugify, uuid, validate } from '../lib/validate.js';
import { requireCouple, requireCsrf } from '../middleware/auth.js';

// Every route below runs after requireCouple, which pins req.weddingId from the signed-in
// account. Every query is scoped by that id, so one couple can never read or change another's data.
export const coupleRouter = Router();
coupleRouter.use(requireCouple, requireCsrf, (_req, res, next) => {
  res.set('Cache-Control', 'no-store, private');
  next();
});

const reservationView = (r) => ({
  id: r.id,
  giftId: r.gift_id,
  giftName: r.gift_name,
  guestName: r.guest_name,
  guestPhone: r.guest_phone,
  message: r.message,
  status: r.status,
  reservedAt: r.reserved_at,
  receivedAt: r.received_at,
  releasedAt: r.released_at,
});

const giftView = (g, reservation) => ({
  id: g.id,
  name: g.name,
  description: g.description,
  image: g.image,
  estimatedPrice: g.estimated_price,
  purchaseUrl: g.purchase_url,
  category: g.category,
  isActive: g.is_active,
  displayOrder: g.display_order,
  reservation: reservation ? reservationView(reservation) : null,
});

async function giftsWithStatus(weddingId) {
  const [gifts, active] = await Promise.all([
    many('SELECT * FROM gifts WHERE wedding_id = $1 ORDER BY display_order, created_at', [weddingId]),
    many('SELECT * FROM gift_reservations WHERE wedding_id = $1 AND active', [weddingId]),
  ]);
  const byGift = new Map(active.map((r) => [r.gift_id, r]));
  return gifts.map((g) => giftView(g, byGift.get(g.id)));
}

async function giftWithStatus(weddingId, giftId) {
  const g = await one('SELECT * FROM gifts WHERE id = $1 AND wedding_id = $2', [giftId, weddingId]);
  if (!g) return null;
  const r = await one('SELECT * FROM gift_reservations WHERE gift_id = $1 AND active', [g.id]);
  return giftView(g, r);
}

// Builds "col = $n" pairs from validated fields, mapping camelCase to column names.
function setClause(data, columns, startAt) {
  const keys = Object.keys(data).filter((k) => columns[k]);
  return {
    sql: keys.map((k, i) => `${columns[k]} = $${startAt + i}`).join(', '),
    values: keys.map((k) => data[k]),
  };
}

const GIFT_COLUMNS = {
  name: 'name',
  description: 'description',
  image: 'image',
  estimatedPrice: 'estimated_price',
  purchaseUrl: 'purchase_url',
  category: 'category',
  isActive: 'is_active',
};

const DREAM_COLUMNS = {
  title: 'title',
  slug: 'slug',
  description: 'description',
  image: 'image',
  targetAmount: 'target_amount',
  offlineAmount: 'offline_amount',
  isActive: 'is_active',
};

coupleRouter.get('/me', (req, res) => {
  res.json({ user: { email: req.user.email }, wedding: req.wedding, payments: { mode: paymentsEnabled() ? 'razorpay' : 'demo' } });
});

coupleRouter.get('/dashboard', async (req, res) => {
  const id = req.weddingId;
  const [gifts, dreams, totals, recent, pledges] = await Promise.all([
    giftsWithStatus(id),
    many('SELECT id, offline_amount FROM dreams WHERE wedding_id = $1', [id]),
    paidTotals(id),
    many('SELECT * FROM gift_reservations WHERE wedding_id = $1 ORDER BY updated_at DESC LIMIT 8', [id]),
    one(`SELECT COUNT(*)::int AS n FROM dream_contributions WHERE wedding_id = $1 AND payment_status = 'pledged'`, [id]),
  ]);
  const reserved = gifts.filter((g) => g.reservation);
  const paid = [...totals.values()].reduce((a, t) => ({ total: a.total + t.total, count: a.count + t.count }), { total: 0, count: 0 });
  res.json({
    stats: {
      totalGifts: gifts.length,
      availableGifts: gifts.filter((g) => g.isActive && !g.reservation).length,
      reservedGifts: reserved.length,
      receivedGifts: reserved.filter((g) => g.reservation.status === 'received').length,
      totalDreams: dreams.length,
      contributionsTotal: paid.total + dreams.reduce((s, d) => s + d.offline_amount, 0),
      contributionsCount: paid.count,
      demoPledges: pledges.n,
    },
    recent: recent.map(reservationView),
  });
});

/* ---------- Wishlist ---------- */

coupleRouter.get('/gifts', async (req, res) => {
  res.json({ gifts: await giftsWithStatus(req.weddingId) });
});

coupleRouter.post('/gifts', async (req, res) => {
  const d = validate(req.body, giftRules);
  const g = await one(
    `INSERT INTO gifts (wedding_id, name, description, image, estimated_price, purchase_url, category, is_active, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (SELECT COALESCE(MAX(display_order) + 1, 0) FROM gifts WHERE wedding_id = $1))
     RETURNING *`,
    [req.weddingId, d.name, d.description, d.image, d.estimatedPrice, d.purchaseUrl, d.category, d.isActive],
  );
  res.status(201).json({ gift: giftView(g) });
});

// Reorder: the full list of this wedding's gift ids in their new order.
coupleRouter.put('/gifts/order', async (req, res) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.length > 500 || !ids.every(isUuid) || new Set(ids).size !== ids.length) {
    throw new HttpError(400, 'invalid', 'Invalid order.');
  }
  await tx(async (c) => {
    const { rows } = await c.query('SELECT COUNT(*)::int AS n FROM gifts WHERE wedding_id = $1 AND id = ANY($2::uuid[])', [req.weddingId, ids]);
    if (rows[0].n !== ids.length) throw new HttpError(400, 'invalid', 'Invalid order.');
    await c.query(
      `UPDATE gifts g SET display_order = v.ord - 1, updated_at = now()
         FROM unnest($2::uuid[]) WITH ORDINALITY AS v(id, ord)
        WHERE g.id = v.id AND g.wedding_id = $1`,
      [req.weddingId, ids],
    );
  });
  res.json({ gifts: await giftsWithStatus(req.weddingId) });
});

coupleRouter.put('/gifts/:giftId', async (req, res) => {
  const id = uuid(req.params.giftId, 'gift');
  const data = validate(req.body, giftRules, { partial: true });
  const set = setClause(data, GIFT_COLUMNS, 3);
  if (set.sql) {
    const updated = await one(`UPDATE gifts SET ${set.sql}, updated_at = now() WHERE id = $1 AND wedding_id = $2 RETURNING id`, [
      id,
      req.weddingId,
      ...set.values,
    ]);
    if (!updated) throw new HttpError(404, 'not_found', 'That gift could not be found.');
    // Keep the copied name on the active reservation in step with the gift.
    if (data.name) await query('UPDATE gift_reservations SET gift_name = $2 WHERE gift_id = $1 AND active', [id, data.name]);
  }
  const gift = await giftWithStatus(req.weddingId, id);
  if (!gift) throw new HttpError(404, 'not_found', 'That gift could not be found.');
  res.json({ gift });
});

coupleRouter.delete('/gifts/:giftId', async (req, res) => {
  const id = uuid(req.params.giftId, 'gift');
  // One statement: deletes only if the gift is ours and has no active reservation.
  const deleted = await one(
    `DELETE FROM gifts g WHERE g.id = $1 AND g.wedding_id = $2
       AND NOT EXISTS (SELECT 1 FROM gift_reservations r WHERE r.gift_id = g.id AND r.active)
     RETURNING id`,
    [id, req.weddingId],
  );
  if (!deleted) {
    const exists = await one('SELECT id FROM gifts WHERE id = $1 AND wedding_id = $2', [id, req.weddingId]);
    if (!exists) throw new HttpError(404, 'not_found', 'That gift could not be found.');
    throw new HttpError(409, 'reserved', 'A guest has reserved this gift. Release the reservation before deleting it, or hide the gift instead.');
  }
  res.json({ ok: true });
});

coupleRouter.post('/uploads', upload.single('image'), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'invalid_image', 'Please choose an image to upload.');
  res.status(201).json({ url: await saveImage(req.file.buffer, req.weddingId) });
});

/* ---------- Reservations (private) ---------- */

coupleRouter.get('/reservations', async (req, res) => {
  const activeOnly = req.query.status === 'active';
  const rows = await many(
    `SELECT * FROM gift_reservations WHERE wedding_id = $1 ${activeOnly ? 'AND active' : ''} ORDER BY reserved_at DESC LIMIT 1000`,
    [req.weddingId],
  );
  res.json({ reservations: rows.map(reservationView) });
});

coupleRouter.post('/reservations/:id/release', async (req, res) => {
  const id = uuid(req.params.id, 'reservation');
  const r = await one(
    `UPDATE gift_reservations SET status = 'released', active = false, released_at = now(), updated_at = now()
      WHERE id = $1 AND wedding_id = $2 AND active RETURNING *`,
    [id, req.weddingId],
  );
  if (!r) throw new HttpError(404, 'not_found', 'That reservation is not active.');
  res.json({ reservation: reservationView(r) });
});

coupleRouter.post('/reservations/:id/mark-received', async (req, res) => {
  const id = uuid(req.params.id, 'reservation');
  const r = await one(
    `UPDATE gift_reservations SET status = 'received', received_at = now(), updated_at = now()
      WHERE id = $1 AND wedding_id = $2 AND active AND status = 'reserved' RETURNING *`,
    [id, req.weddingId],
  );
  if (!r) throw new HttpError(404, 'not_found', 'That reservation is not awaiting delivery.');
  res.json({ reservation: reservationView(r) });
});

/* ---------- Dreams ---------- */

coupleRouter.get('/dreams', async (req, res) => {
  const [dreams, totals] = await Promise.all([
    many('SELECT * FROM dreams WHERE wedding_id = $1 ORDER BY display_order, created_at', [req.weddingId]),
    paidTotals(req.weddingId),
  ]);
  res.json({ dreams: dreams.map((d) => privateDream(d, totals)) });
});

const slugTaken = (e) => {
  if (isUniqueViolation(e)) throw new HttpError(409, 'slug_taken', 'Another dream already uses that link.', { slug: 'Choose a different link.' });
  throw e;
};

coupleRouter.post('/dreams', async (req, res) => {
  const d = validate(req.body, dreamRules);
  d.slug = d.slug || slugify(d.title);
  if (!d.slug || d.slug.length < 2) throw new HttpError(400, 'validation', 'Please check the highlighted fields.', { slug: 'Please choose a link.' });
  const dream = await one(
    `INSERT INTO dreams (wedding_id, slug, title, description, image, target_amount, offline_amount, is_active, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (SELECT COUNT(*) FROM dreams WHERE wedding_id = $1)) RETURNING *`,
    [req.weddingId, d.slug, d.title, d.description, d.image, d.targetAmount, d.offlineAmount, d.isActive],
  ).catch(slugTaken);
  res.status(201).json({ dream: privateDream(dream, new Map()) });
});

coupleRouter.put('/dreams/:dreamId', async (req, res) => {
  const id = uuid(req.params.dreamId, 'dream');
  const data = validate(req.body, dreamRules, { partial: true });
  const set = setClause(data, DREAM_COLUMNS, 3);
  const dream = set.sql
    ? await one(`UPDATE dreams SET ${set.sql}, updated_at = now() WHERE id = $1 AND wedding_id = $2 RETURNING *`, [
        id,
        req.weddingId,
        ...set.values,
      ]).catch(slugTaken)
    : await one('SELECT * FROM dreams WHERE id = $1 AND wedding_id = $2', [id, req.weddingId]);
  if (!dream) throw new HttpError(404, 'not_found', 'That dream could not be found.');
  res.json({ dream: privateDream(dream, await paidTotals(req.weddingId)) });
});

coupleRouter.delete('/dreams/:dreamId', async (req, res) => {
  const id = uuid(req.params.dreamId, 'dream');
  const deleted = await one(
    `DELETE FROM dreams d WHERE d.id = $1 AND d.wedding_id = $2
       AND NOT EXISTS (SELECT 1 FROM dream_contributions c WHERE c.dream_id = d.id AND c.payment_status = 'paid')
     RETURNING id`,
    [id, req.weddingId],
  );
  if (!deleted) {
    const exists = await one('SELECT id FROM dreams WHERE id = $1 AND wedding_id = $2', [id, req.weddingId]);
    if (!exists) throw new HttpError(404, 'not_found', 'That dream could not be found.');
    throw new HttpError(409, 'has_contributions', 'Guests have contributed to this dream. Hide it instead so their contributions stay on record.');
  }
  res.json({ ok: true });
});

coupleRouter.get('/contributions', async (req, res) => {
  const rows = await many(
    `SELECT c.*, d.title AS dream_title FROM dream_contributions c JOIN dreams d ON d.id = c.dream_id
      WHERE c.wedding_id = $1 AND c.payment_status IN ('paid', 'pledged')
      ORDER BY c.created_at DESC LIMIT 1000`,
    [req.weddingId],
  );
  res.json({
    contributions: rows.map((c) => ({
      id: c.id,
      dreamTitle: c.dream_title,
      contributorName: c.contributor_name,
      message: c.message,
      amount: c.amount,
      paymentStatus: c.payment_status,
      paymentReference: c.payment_reference,
      createdAt: c.created_at,
      paidAt: c.paid_at,
    })),
  });
});
