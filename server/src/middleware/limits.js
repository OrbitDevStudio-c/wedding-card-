import rateLimit from 'express-rate-limit';
import { env } from '../env.js';

const LIMITS = {
  reserve: () => env.RATE_RESERVE,
  login: () => env.RATE_LOGIN,
  contribute: () => env.RATE_CONTRIBUTE,
};

export function limiter(kind) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: LIMITS[kind](),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: kind === 'login',
    message: { error: 'rate_limited', message: 'Too many attempts. Please wait a few minutes and try again.' },
  });
}

export const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: env.isTest ? 5000 : 300, standardHeaders: 'draft-7', legacyHeaders: false });
