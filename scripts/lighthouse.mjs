// Runs mobile Lighthouse against the production preview (npm run build && npm run preview)
// using Playwright's bundled Chromium, and prints the four category scores.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const url = process.argv[2] || 'http://localhost:4173/';
const chrome = await chromeLauncher.launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless=new', '--no-sandbox'],
});
try {
  const { lhr, report, artifacts } = await lighthouse(url, {
    port: chrome.port,
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    maxWaitForLoad: 45_000,
  });
  await mkdir('lighthouse', { recursive: true });
  await writeFile('lighthouse/report.html', report);
  await writeFile('lighthouse/report.json', JSON.stringify(lhr));
  if (process.env.LH_TRACE) await writeFile('lighthouse/trace.json', JSON.stringify(artifacts.Trace));

  const scores = Object.values(lhr.categories).map((c) => `${c.title.padEnd(16)} ${Math.round(c.score * 100)}`);
  const metric = (id) => lhr.audits[id].displayValue;
  process.stdout.write(
    [
      ...scores,
      '',
      `FCP ${metric('first-contentful-paint')} · LCP ${metric('largest-contentful-paint')} · TBT ${metric('total-blocking-time')} · CLS ${metric('cumulative-layout-shift')} · SI ${metric('speed-index')}`,
      ...Object.values(lhr.audits)
        .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable')
        .map((a) => `  ⚠ ${a.id}: ${a.title}${a.displayValue ? ` (${a.displayValue})` : ''}`),
      '',
      'Full report: lighthouse/report.html',
    ].join('\n') + '\n',
  );
} finally {
  await chrome.kill();
}
