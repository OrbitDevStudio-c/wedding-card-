import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { HttpError } from '../lib/validate.js';
import { clearSession, issueSession, requireCouple } from '../middleware/auth.js';
import { limiter } from '../middleware/limits.js';
import { one } from '../db.js';

export const authRouter = Router();

// Compared against when the email is unknown, so both paths take the same time.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 12);

authRouter.post('/login', limiter('login'), async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 200) {
    throw new HttpError(400, 'invalid', 'Please enter your email and password.');
  }
  const user = await one('SELECT id, wedding_id, password_hash, token_version FROM couple_users WHERE email = $1', [
    email.trim().toLowerCase(),
  ]);
  const ok = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'invalid_credentials', 'That email and password do not match.');
  issueSession(res, user);
  res.json({ ok: true });
});

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

authRouter.get('/session', requireCouple, (req, res) => {
  res.set('Cache-Control', 'no-store, private');
  res.json({ authenticated: true, email: req.user.email, wedding: req.wedding.slug });
});
