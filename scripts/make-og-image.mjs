// Renders the 1200×630 link-preview image (WhatsApp, iMessage, social) with the site's own
// fonts, plus the 180×180 Apple touch icon. Re-run after changing names or dates in config.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { couple, dates, venue } from '../src/config.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// Inlined because a page built with setContent cannot read file:// URLs
const font = (file) =>
  `data:font/woff2;base64,${readFileSync(path.join(root, 'public', 'fonts', file)).toString('base64')}`;

const html = `<!doctype html><html><head><style>
@font-face { font-family: Script; src: url(${font('pinyon-script-400.woff2')}); }
@font-face { font-family: Serif; src: url(${font('cormorant-400-italic.woff2')}); font-style: italic; }
@font-face { font-family: Label; src: url(${font('cinzel-500.woff2')}); }
html, body { margin: 0; }
body { width: 1200px; height: 630px; display: grid; place-items: center; overflow: hidden;
  background: radial-gradient(60% 70% at 50% 45%, #165047, #0b2b27 60%, #061b18); color: #fdfaf3; }
.frame { position: absolute; inset: 28px; border: 1.5px solid rgba(226,201,149,.6); border-radius: 10px; }
.frame::after { content: ''; position: absolute; inset: 10px; border: 1px solid rgba(226,201,149,.3); border-radius: 6px; }
.arch { position: absolute; left: 50%; top: 64px; width: 860px; height: 566px; transform: translateX(-50%);
  border: 1.5px solid rgba(226,201,149,.55); border-bottom: 0; border-radius: 999px 999px 0 0; }
.content { position: relative; text-align: center; }
.label { font-family: Label; letter-spacing: .32em; font-size: 20px; color: #e2c995; text-transform: uppercase; }
.names { font-family: Script; font-size: 128px; line-height: 1.05; margin: 18px 0 6px; }
.amp { color: #e2c995; font-family: Serif; font-style: italic; font-size: 76px; }
.line { font-family: Serif; font-style: italic; font-size: 34px; color: #ecdcb6; margin-bottom: 22px; }
</style></head><body>
<div class="frame"></div><div class="arch"></div>
<div class="content">
  <div class="label">You are invited to the wedding of</div>
  <div class="names">${couple.bride.name} <span class="amp">&amp;</span> ${couple.groom.name}</div>
  <div class="line">${venue.name}, ${venue.city.split(',')[0]}</div>
  <div class="label">${dates.display}</div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: 'png' });
await browser.close();

await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(root, 'public', 'og-image.jpg'));
await sharp(path.join(root, 'public', 'favicon.svg'), { density: 400 })
  .resize(180, 180)
  .flatten({ background: '#0b2b27' })
  .png()
  .toFile(path.join(root, 'public', 'apple-touch-icon.png'));
process.stdout.write('Wrote public/og-image.jpg and public/apple-touch-icon.png\n');
