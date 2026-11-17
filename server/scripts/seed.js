// Creates (or refreshes) a wedding with the sample wishlist and dreams, plus its couple login.
//
//   COUPLE_EMAIL=you@example.com COUPLE_PASSWORD='a long passphrase' npm run seed
//
// Existing gifts and dreams are left alone unless --reset is passed. --reset also deletes this
// wedding's reservations and contributions, so never run it against a live wedding.
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import { connectDb, one, pool, query } from '../src/db.js';
import { sampleDreams, sampleGifts } from './seed-data.js';

export async function seedWedding({ slug, coupleNames, weddingDate, email, password, reset = false, samples = true }) {
  const wedding = await one(
    `INSERT INTO weddings (slug, couple_names, wedding_date) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING *`,
    [slug, coupleNames, weddingDate],
  );
  if (reset) {
    // Contributions and reservations go with their dreams/gifts or explicitly.
    await query('DELETE FROM gift_reservations WHERE wedding_id = $1', [wedding.id]);
    await query('DELETE FROM dream_contributions WHERE wedding_id = $1', [wedding.id]);
    await query('DELETE FROM gifts WHERE wedding_id = $1', [wedding.id]);
    await query('DELETE FROM dreams WHERE wedding_id = $1', [wedding.id]);
    await query('UPDATE weddings SET gifts_enabled = true, dreams_enabled = true WHERE id = $1', [wedding.id]);
  }
  if (samples && !(await one('SELECT 1 FROM gifts WHERE wedding_id = $1 LIMIT 1', [wedding.id]))) {
    for (const [i, g] of sampleGifts.entries()) {
      await query(
        `INSERT INTO gifts (wedding_id, name, description, image, estimated_price, purchase_url, category, translations, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [wedding.id, g.name, g.description, g.image, g.estimatedPrice, g.purchaseUrl, g.category, g.translations || {}, i],
      );
    }
  }
  if (samples && !(await one('SELECT 1 FROM dreams WHERE wedding_id = $1 LIMIT 1', [wedding.id]))) {
    for (const [i, d] of sampleDreams.entries()) {
      await query(
        `INSERT INTO dreams (wedding_id, slug, title, description, image, target_amount, offline_amount, translations, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [wedding.id, d.slug, d.title, d.description, d.image, d.targetAmount, d.offlineAmount, d.translations || {}, i],
      );
    }
  }
  if (email && password) await upsertCouple(wedding.id, email, password);
  return wedding;
}

export async function upsertCouple(weddingId, email, password) {
  const hash = await bcrypt.hash(password, 12);
  // Bumping token_version signs out any session issued with the old password.
  await query(
    `INSERT INTO couple_users (wedding_id, email, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET wedding_id = $1, password_hash = $3,
       token_version = couple_users.token_version + 1, updated_at = now()`,
    [weddingId, email.trim().toLowerCase(), hash],
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const reset = process.argv.includes('--reset');
  const { COUPLE_EMAIL: email, COUPLE_PASSWORD: password } = process.env;
  if (password && password.length < 12) throw new Error('COUPLE_PASSWORD must be at least 12 characters.');
  await connectDb();
  const wedding = await seedWedding({
    slug: process.env.WEDDING_SLUG || 'alica-rushil',
    coupleNames: process.env.WEDDING_COUPLE || 'Alica & Rushil',
    weddingDate: process.env.WEDDING_DATE || '2027-02-13T10:30:00+05:30',
    email,
    password,
    reset,
  });
  console.log(`Seeded wedding "${wedding.slug}"${email ? ` with couple login ${email}` : ' (no couple login: set COUPLE_EMAIL and COUPLE_PASSWORD)'}.`);
  await pool.end();
}
