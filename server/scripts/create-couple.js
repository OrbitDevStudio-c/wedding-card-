// Creates or updates a couple login for an existing wedding, and signs out its old sessions.
//
//   COUPLE_PASSWORD="at least 12 characters" npm run create-couple -- --wedding alica-rushil --email couple@example.com
//
// The password is read from the environment so it never lands in shell history as an argument.
import { connectDb, one, pool } from '../src/db.js';
import { upsertCouple } from './seed.js';

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

const slug = arg('wedding') || process.env.WEDDING_SLUG;
const email = (arg('email') || process.env.COUPLE_EMAIL || '').trim().toLowerCase();
const password = process.env.COUPLE_PASSWORD || '';

if (!slug || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 12) {
  console.error('Usage: COUPLE_PASSWORD="at least 12 characters" npm run create-couple -- --wedding <slug> --email <email>');
  process.exit(1);
}

await connectDb();
const wedding = await one('SELECT id FROM weddings WHERE slug = $1', [slug]);
if (!wedding) {
  console.error(`No wedding "${slug}". Run "npm run seed" first.`);
  process.exit(1);
}
await upsertCouple(wedding.id, email, password);
console.log(`Couple login ${email} can now manage "${slug}".`);
await pool.end();
