import { rsvp } from '../config.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Sends an RSVP to Formspree (or any JSON endpoint) or a Google Apps Script web app.
// With no endpoint configured, it resolves after a short pause so the full flow can be previewed.
export async function submitRsvp(data) {
  const payload = {
    name: data.name.trim(),
    phone: data.phone.trim(),
    attending: data.attending === 'yes' ? 'Yes' : 'No',
    guests: data.attending === 'yes' ? String(data.guests) : '0',
    events: data.attending === 'yes' ? data.events.join(', ') : '',
    message: data.message.trim(),
    submittedAt: new Date().toISOString(),
  };

  if (!rsvp.endpoint) {
    await wait(1200);
    return { demo: true };
  }

  // Apps Script does not send CORS headers, so post as a simple form and trust delivery.
  if (/script\.google(usercontent)?\.com/.test(rsvp.endpoint)) {
    await fetch(rsvp.endpoint, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(payload) });
    return { demo: false };
  }

  const res = await fetch(rsvp.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`RSVP failed with status ${res.status}`);
  return { demo: false };
}
