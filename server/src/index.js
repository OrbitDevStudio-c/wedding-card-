import { createApp } from './app.js';
import { connectDb } from './db.js';
import { assertEnv, env, paymentsEnabled } from './env.js';

assertEnv();
await connectDb();
const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT} (${env.NODE_ENV}, payments: ${paymentsEnabled() ? 'razorpay' : 'demo'})`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
