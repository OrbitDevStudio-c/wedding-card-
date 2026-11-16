import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { HttpError } from '../lib/validate.js';
import { one } from '../db.js';

export const SESSION_COOKIE = 'wg_session';
export const CSRF_COOKIE = 'wg_csrf';

const cookieBase = () => ({
  secure: env.isProd,
  sameSite: 'strict',
  path: '/',
  maxAge: env.SESSION_HOURS * 3600 * 1000,
});

export function issueSession(res, user) {
  const token = jwt.sign({ sub: user.id, wid: user.wedding_id, v: user.token_version }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: `${env.SESSION_HOURS}h`,
  });
  const csrf = crypto.randomBytes(24).toString('base64url');
  // Session: HttpOnly so page scripts can never read it. CSRF token: readable by our own page,
  // echoed back in a header (double-submit), which another site cannot do.
  res.cookie(SESSION_COOKIE, token, { ...cookieBase(), httpOnly: true });
  res.cookie(CSRF_COOKIE, csrf, { ...cookieBase(), httpOnly: false });
  return csrf;
}

export function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.clearCookie(CSRF_COOKIE, { path: '/' });
}

// Verifies the session, re-loads the user from the database (so deleted users or bumped token
// versions are rejected immediately) and pins req.weddingId for every downstream query.
export async function requireCouple(req, _res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) throw new HttpError(401, 'unauthenticated', 'Please sign in.');
    let claims;
    try {
      claims = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
      throw new HttpError(401, 'unauthenticated', 'Your session has ended. Please sign in again.');
    }
    if (typeof claims.sub !== 'string' || typeof claims.wid !== 'string') throw new HttpError(401, 'unauthenticated', 'Please sign in.');
    const row = await one(
      `SELECT u.id, u.email, u.role, u.token_version, w.id AS wedding_id, w.slug, w.couple_names, w.wedding_date,
              w.gifts_enabled, w.dreams_enabled
         FROM couple_users u JOIN weddings w ON w.id = u.wedding_id
        WHERE u.id = $1`,
      [claims.sub],
    );
    if (!row || row.token_version !== claims.v || row.wedding_id !== claims.wid) {
      throw new HttpError(401, 'unauthenticated', 'Please sign in.');
    }
    req.user = { id: row.id, email: row.email, role: row.role };
    req.wedding = {
      slug: row.slug,
      coupleNames: row.couple_names,
      weddingDate: row.wedding_date,
      giftsEnabled: row.gifts_enabled,
      dreamsEnabled: row.dreams_enabled,
    };
    req.weddingId = row.wedding_id;
    next();
  } catch (err) {
    next(err);
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireCsrf(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const cookie = req.cookies?.[CSRF_COOKIE];
  const header = req.get('x-csrf-token');
  const ok =
    typeof cookie === 'string' &&
    typeof header === 'string' &&
    cookie.length === header.length &&
    crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header));
  return ok ? next() : next(new HttpError(403, 'csrf', 'Your session needs refreshing. Please reload the page.'));
}
