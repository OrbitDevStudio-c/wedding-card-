import { GIFT_CATEGORIES } from '../db.js';

export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export function uuid(v, what = 'id') {
  if (!isUuid(v)) throw new HttpError(404, 'not_found', `That ${what} could not be found.`);
  return v;
}

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;

export function slug(v, what = 'page') {
  if (typeof v !== 'string' || !SLUG_RE.test(v)) throw new HttpError(404, 'not_found', `That ${what} could not be found.`);
  return v;
}

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

// Strips control characters and collapses whitespace; only accepts real strings.
function cleanText(v, { max, multiline = false }) {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') return null;
  let s = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  s = multiline ? s.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ');
  s = s.trim();
  return s.length > max ? null : s;
}

// Tiny declarative validator: returns clean values or throws a 400 listing every bad field.
export function validate(body, rules, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'invalid', 'Invalid request body.');
  const out = {};
  const fields = {};
  for (const [key, rule] of Object.entries(rules)) {
    const raw = body[key];
    if (partial && raw === undefined) continue;
    const missing = raw === undefined || raw === null || raw === '';
    if (missing) {
      if (rule.required) fields[key] = rule.message || 'This field is required.';
      else if (rule.default !== undefined) out[key] = rule.default;
      continue;
    }
    let value;
    switch (rule.type) {
      case 'text':
        value = cleanText(raw, rule);
        if (value === null || (rule.min && value.length < rule.min)) value = undefined;
        if (value !== undefined && rule.pattern && !rule.pattern.test(value)) value = undefined;
        break;
      case 'int': {
        const n = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\d+$/.test(raw.trim()) ? Number(raw) : NaN;
        value = Number.isInteger(n) && n >= (rule.min ?? 0) && n <= (rule.max ?? Number.MAX_SAFE_INTEGER) ? n : undefined;
        break;
      }
      case 'bool':
        value = typeof raw === 'boolean' ? raw : raw === 'true' ? true : raw === 'false' ? false : undefined;
        break;
      case 'enum':
        value = typeof raw === 'string' && rule.values.includes(raw) ? raw : undefined;
        break;
      case 'url':
        value = safeUrl(raw);
        break;
      case 'image':
        value = safeImagePath(raw);
        break;
      default:
        value = undefined;
    }
    if (value === undefined) fields[key] = rule.message || 'Please check this field.';
    else out[key] = value;
  }
  if (Object.keys(fields).length) throw new HttpError(400, 'validation', 'Please check the highlighted fields.', fields);
  return out;
}

// Only http(s) links, so a gift link can never become javascript: or data:.
export function safeUrl(v) {
  if (typeof v !== 'string' || v.length > 1000) return undefined;
  try {
    const u = new URL(v.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}

// Images are either our own uploads, files shipped in /public, or https URLs.
export function safeImagePath(v) {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  if (/^\/(?:api\/uploads|gifts|photos)\/[A-Za-z0-9._/-]{1,200}$/.test(s) && !s.includes('..')) return s;
  const url = safeUrl(s);
  return url && url.startsWith('https://') ? url : undefined;
}

export const phoneRule = { type: 'text', max: 20, pattern: /^\+?[0-9 ()-]{7,20}$/, message: 'Please enter a valid phone number.' };

export const giftRules = {
  name: { type: 'text', required: true, max: 120, min: 2, message: 'Please name the gift (2–120 characters).' },
  description: { type: 'text', max: 600, multiline: true, default: '' },
  image: { type: 'image', default: '', message: 'Please upload an image or use an https:// image link.' },
  estimatedPrice: { type: 'int', min: 0, max: 100_000_000, default: 0, message: 'Enter a price in whole rupees.' },
  purchaseUrl: { type: 'url', default: '', message: 'Enter a full link starting with https://' },
  category: { type: 'enum', values: GIFT_CATEGORIES, default: 'other' },
  isActive: { type: 'bool', default: true },
};

export const dreamRules = {
  title: { type: 'text', required: true, max: 120, min: 2, message: 'Please give the dream a title.' },
  slug: { type: 'text', max: 60, pattern: SLUG_RE, message: 'Use lowercase letters, numbers and dashes.' },
  description: { type: 'text', max: 1000, multiline: true, default: '' },
  image: { type: 'image', default: '', message: 'Please upload an image or use an https:// image link.' },
  targetAmount: { type: 'int', required: true, min: 1, max: 100_000_000, message: 'Enter a goal in whole rupees.' },
  offlineAmount: { type: 'int', min: 0, max: 100_000_000, default: 0, message: 'Enter an amount in whole rupees.' },
  isActive: { type: 'bool', default: true },
};
