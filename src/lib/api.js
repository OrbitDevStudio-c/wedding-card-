// Thin fetch wrapper for the gifts API. Always same-origin /api so cookies stay first-party.
const BASE = '/api';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || 'Something went wrong. Please try again.');
    this.status = status;
    this.code = body?.error || 'error';
    this.fields = body?.fields || {};
  }
}

const csrfToken = () => document.cookie.match(/(?:^|;\s*)wg_csrf=([^;]+)/)?.[1] || '';

export async function api(path, { method = 'GET', body, formData, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (method !== 'GET') headers['X-CSRF-Token'] = csrfToken();
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
      credentials: 'same-origin',
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(0, { error: 'network', message: 'We could not reach the server. Please check your connection and try again.' });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const formatDate = (d) =>
  d ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(d)) : '';
