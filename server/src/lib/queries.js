import { many, one } from '../db.js';
import { HttpError, slug } from './validate.js';

export async function findWedding(rawSlug, feature) {
  const w = await one('SELECT * FROM weddings WHERE slug = $1', [slug(rawSlug, 'wedding')]);
  if (!w) throw new HttpError(404, 'not_found', 'This wedding could not be found.');
  if (feature === 'gifts' && !w.gifts_enabled) throw new HttpError(404, 'disabled', 'Gifts are not enabled for this wedding.');
  if (feature === 'dreams' && (!w.gifts_enabled || !w.dreams_enabled)) {
    throw new HttpError(404, 'disabled', 'Dreams are not enabled for this wedding.');
  }
  return w;
}

// Only payments verified by the gateway count. Demo pledges and unpaid orders never do.
export async function paidTotals(weddingId) {
  const rows = await many(
    `SELECT dream_id, SUM(amount)::bigint AS total, COUNT(*)::int AS count
       FROM dream_contributions WHERE wedding_id = $1 AND payment_status = 'paid' GROUP BY dream_id`,
    [weddingId],
  );
  return new Map(rows.map((r) => [r.dream_id, { total: r.total, count: r.count }]));
}

// Public shape of a gift: no reservation fields exist on it at all.
export const publicGift = (g) => ({
  id: g.id,
  name: g.name,
  description: g.description,
  image: g.image,
  estimatedPrice: g.estimated_price,
  purchaseUrl: g.purchase_url,
  category: g.category,
  translations: g.translations || {},
});

const progress = (raised, target) => Math.min(100, Math.round((raised / target) * 1000) / 10);

export function publicDream(d, totals) {
  const raised = (totals.get(d.id)?.total || 0) + d.offline_amount;
  return {
    id: d.id,
    slug: d.slug,
    title: d.title,
    description: d.description,
    image: d.image,
    targetAmount: d.target_amount,
    raisedAmount: raised,
    progress: progress(raised, d.target_amount),
    translations: d.translations || {},
  };
}

export function privateDream(d, totals) {
  const t = totals.get(d.id) || { total: 0, count: 0 };
  const raised = t.total + d.offline_amount;
  return {
    ...publicDream(d, totals),
    offlineAmount: d.offline_amount,
    paidAmount: t.total,
    contributions: t.count,
    isActive: d.is_active,
    raisedAmount: raised,
  };
}
