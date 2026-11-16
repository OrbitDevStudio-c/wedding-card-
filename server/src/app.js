import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { isConnectError } from './db.js';
import { env } from './env.js';
import { HttpError } from './lib/validate.js';
import { apiLimiter } from './middleware/limits.js';
import { authRouter } from './routes/auth.js';
import { coupleRouter } from './routes/couple.js';
import { paymentsRouter } from './routes/payments.js';
import { publicRouter } from './routes/public.js';

// NoSQL injection guard: request input may never carry Mongo operators ($gt, $where...) or
// dotted paths. Every handler also type-checks its fields, so objects never reach a query.
function hasOperatorKeys(value, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 8) return false;
  return Object.keys(value).some((k) => k.startsWith('$') || k.includes('.') || hasOperatorKeys(value[k], depth + 1));
}
function rejectOperators(req, _res, next) {
  if (hasOperatorKeys(req.body) || hasOperatorKeys(req.query) || hasOperatorKeys(req.params)) {
    return next(new HttpError(400, 'invalid', 'Invalid request.'));
  }
  next();
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));

  // CORS: only explicitly listed origins, with credentials. Same-origin calls need nothing.
  app.use((req, res, next) => {
    const origin = req.get('origin');
    if (origin && env.CORS_ORIGINS.includes(origin)) {
      res.set({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        Vary: 'Origin',
      });
      if (req.method === 'OPTIONS') return res.sendStatus(204);
    }
    next();
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Webhooks need the raw body for signature checks, so they mount before the JSON parser.
  app.use('/api/payments', paymentsRouter);

  app.use('/api', apiLimiter, express.json({ limit: '32kb', strict: true }), cookieParser(), rejectOperators);
  app.use(
    '/api/uploads',
    express.static(env.UPLOAD_DIR, {
      immutable: true,
      maxAge: '365d',
      index: false,
      dotfiles: 'deny',
      setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
    }),
  );
  app.use('/api/auth', authRouter);
  app.use('/api/couple', coupleRouter);
  app.use('/api', publicRouter);

  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'not_found', 'Not found.')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') err = new HttpError(400, 'invalid', 'Invalid JSON.');
    if (err?.type === 'entity.too.large' || err?.code === 'LIMIT_FILE_SIZE') err = new HttpError(413, 'too_large', 'That is too large.');
    if (err?.name === 'MulterError') err = new HttpError(400, 'invalid_upload', 'Please upload a single image.');
    if (err?.name === 'ValidationError') err = new HttpError(400, 'validation', 'Please check the highlighted fields.');
    if (isConnectError(err)) err = new HttpError(503, 'busy', 'We are a little busy right now. Please try again in a moment.');
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.code, message: err.message, ...(err.fields && { fields: err.fields }) });
    }
    console.error('[api] unexpected error', err);
    res.status(500).json({ error: 'server_error', message: 'Something went wrong on our side. Please try again.' });
  });

  return app;
}
