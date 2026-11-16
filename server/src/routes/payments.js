import express, { Router } from 'express';
import { claimWebhookEvent, markFailed, markPaid, verifyWebhookSignature } from '../lib/payments.js';

export const paymentsRouter = Router();

// Razorpay webhook. Configure in Razorpay Dashboard -> Webhooks with events payment.captured,
// order.paid and payment.failed. The signature is checked against the raw body, and each event
// id is recorded once, so duplicate deliveries are acknowledged without being applied twice.
paymentsRouter.post('/razorpay/webhook', express.raw({ type: 'application/json', limit: '256kb' }), async (req, res) => {
  if (!verifyWebhookSignature(req.body, req.get('x-razorpay-signature'))) {
    return res.status(400).json({ error: 'invalid_signature' });
  }
  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'invalid_body' });
  }
  const eventId = req.get('x-razorpay-event-id') || event?.id;
  if (typeof eventId !== 'string' || !eventId) return res.status(400).json({ error: 'missing_event_id' });
  if (!(await claimWebhookEvent(eventId, event.event))) return res.json({ ok: true, duplicate: true });

  const payment = event?.payload?.payment?.entity;
  const orderId = payment?.order_id || event?.payload?.order?.entity?.id;
  if (typeof orderId !== 'string') return res.json({ ok: true, ignored: true });

  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    if (typeof payment?.id !== 'string') return res.json({ ok: true, ignored: true });
    const result = await markPaid({ orderId, paymentId: payment.id, amountPaise: payment.amount });
    return res.json({ ok: true, result: result.status });
  }
  if (event.event === 'payment.failed') {
    await markFailed(orderId);
    return res.json({ ok: true, result: 'failed' });
  }
  res.json({ ok: true, ignored: true });
});
