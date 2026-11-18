// Vercel serverless entry for the gifts API. vercel.json rewrites every /api/* request here;
// req.url keeps the original path, so the Express routes in server/ match unchanged.
import { createApp } from '../server/src/app.js';
import { connectDb } from '../server/src/db.js';
import { assertEnv } from '../server/src/env.js';

let ready;
const init = () => {
  if (!ready) {
    ready = (async () => {
      assertEnv();
      await connectDb();
      return createApp();
    })().catch((err) => {
      ready = undefined; // let the next request retry instead of caching the failure
      throw err;
    });
  }
  return ready;
};

export default async function handler(req, res) {
  try {
    const app = await init();
    return app(req, res);
  } catch (err) {
    console.error('[api] start-up failed:', err.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'unavailable', message: 'The gifts service is starting up. Please try again in a moment.' }));
  }
}
