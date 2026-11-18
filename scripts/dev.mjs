// `npm run dev`: starts the gifts API (port 4000) and the Vite dev server together, so /gifts
// and the couple dashboard work locally. Ctrl+C stops both. Extra args go to Vite.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env');
if (!existsSync(envFile)) console.warn('[dev] No .env found: the gifts API needs NEON_DB (or DATABASE_URL). See .env.example.');

const procs = [
  ['api', ['--env-file-if-exists=' + envFile, path.join(root, 'server/src/index.js')], path.join(root, 'server')],
  ['web', [path.join(root, 'node_modules/vite/bin/vite.js'), ...process.argv.slice(2)], root],
].map(([name, args, cwd]) => {
  const child = spawn(process.execPath, args, { cwd, stdio: ['ignore', 'inherit', 'inherit'] });
  child.on('exit', (code) => {
    if (stopping) return;
    // If the API cannot start (no database, port 4000 taken) keep the site running; /gifts says so.
    if (name === 'api') return console.warn(`[dev] gifts API exited (${code ?? 'signal'}); the site keeps running without it.`);
    console.log(`[dev] ${name} exited (${code ?? 'signal'}); stopping.`);
    stop(code || 1);
  });
  return child;
});

let stopping = false;
function stop(code = 0) {
  stopping = true;
  for (const p of procs) if (p.exitCode === null) p.kill();
  setTimeout(() => process.exit(code), 300);
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
