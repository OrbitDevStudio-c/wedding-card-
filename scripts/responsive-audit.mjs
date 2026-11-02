// Responsive audit: drives the built site (npm run preview) at each device size, interacts with every
// section, records layout problems and saves screenshots.
//   node scripts/responsive-audit.mjs <label>     → screenshots/responsive/<label>/ + results.json
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = process.env.AUDIT_URL || 'http://localhost:4173/';
const label = process.argv[2] || 'run';
const OUT = `screenshots/responsive/${label}`;

const DEVICES = [
  { name: 'small-mobile-320x568', width: 320, height: 568, touch: true },
  { name: 'mobile-375x812', width: 375, height: 812, touch: true },
  { name: 'iphone-390x844', width: 390, height: 844, touch: true },
  { name: 'large-mobile-430x932', width: 430, height: 932, touch: true },
  { name: 'tablet-portrait-768x1024', width: 768, height: 1024, touch: true },
  { name: 'tablet-landscape-1024x768', width: 1024, height: 768, touch: true },
  { name: 'laptop-1366x768', width: 1366, height: 768, touch: false },
  { name: 'desktop-1920x1080', width: 1920, height: 1080, touch: false },
];

const SECTIONS = ['top', 'story', 'date', 'countdown', 'venue', 'events', 'gallery', 'travel', 'rsvp', 'blessings'];

async function scrollThrough(page) {
  const step = await page.evaluate(() => window.innerHeight * 0.6);
  for (let y = 0; ; y += step) {
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    await page.evaluate((top) => window.scrollTo(0, top), Math.min(y, max));
    await page.waitForTimeout(60);
    if (y >= max) break;
  }
  await page.waitForTimeout(1500);
}

// Everything measured in one pass over the opened page.
function measure(sections) {
  const vw = document.documentElement.clientWidth;
  const visible = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0 && r.width > 0 && r.height > 0;
  };
  const clippedByAncestor = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(hidden|clip)/.test(s.overflowX) || /(hidden|clip)/.test(s.overflow)) return true;
    }
    return false;
  };
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const text = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${text ? ` "${text}"` : ''}`;
  };

  const result = {
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: vw,
    horizontalScroll: document.documentElement.scrollWidth > vw + 1,
    overflowing: [],
    smallTargets: [],
    tinyText: [],
    clippedText: [],
    overlaps: {},
    images: { broken: [], oversized: [] },
  };

  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.intro, .lightbox, [aria-hidden="true"]')) continue;
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !clippedByAncestor(el) && getComputedStyle(el).position !== 'fixed') {
      result.overflowing.push(`${describe(el)} [${Math.round(r.left)}→${Math.round(r.right)}]`);
    }
  }

  for (const el of document.querySelectorAll('a[href], button, input, textarea, label.choice, label.check')) {
    if (el.closest('.intro, .lightbox') || !visible(el)) continue;
    if (el.matches('input[type=radio], input[type=checkbox]')) continue; // the label is the target
    const r = el.getBoundingClientRect();
    // Inline text links inside running copy are exempt (WCAG 2.5.8 inline exception)
    const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline';
    if (!inline && (r.width < 44 || r.height < 44)) result.smallTargets.push(`${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!n.textContent.trim() || seen.has(el) || el.closest('.intro, .lightbox, .visually-hidden, svg, [aria-hidden="true"]')) continue;
    seen.add(el);
    if (!visible(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 12) result.tinyText.push(`${describe(el)} ${fs}px`);
    if (el.scrollWidth > el.clientWidth + 2 && /(hidden|clip)/.test(getComputedStyle(el).overflowX) && el.clientWidth > 0) {
      result.clippedText.push(describe(el));
    }
  }

  for (const id of sections) {
    const root = document.getElementById(id);
    if (!root) continue;
    const nodes = [...root.querySelectorAll('*')].filter((el) => {
      if (el.closest('[aria-hidden="true"], svg, canvas, .scratch')) return false;
      return [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) && visible(el);
    });
    const rectOf = (el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect();
    };
    const found = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].contains(nodes[j]) || nodes[j].contains(nodes[i])) continue;
        const a = rectOf(nodes[i]);
        const b = rectOf(nodes[j]);
        const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (x > 4 && y > 4) found.push(`${describe(nodes[i])} ⟷ ${describe(nodes[j])}`);
      }
    }
    if (found.length) result.overlaps[id] = found;
  }

  for (const img of document.querySelectorAll('img')) {
    if (img.closest('.lightbox')) continue;
    if (img.complete && img.naturalWidth === 0) result.images.broken.push(img.currentSrc || img.src);
    const r = img.getBoundingClientRect();
    if (img.naturalWidth && r.width && img.naturalWidth / (r.width * devicePixelRatio) > 2.6) {
      result.images.oversized.push(`${(img.currentSrc || '').split('/').pop()} natural ${img.naturalWidth}px shown ${Math.round(r.width)}px`);
    }
  }
  return result;
}

const inViewport = (box, vw, vh) => box && box.x >= -1 && box.y >= -1 && box.x + box.width <= vw + 1 && box.y + box.height <= vh + 1;

async function auditDevice(browser, device) {
  const { width, height, touch } = device;
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch && width < 1024, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = 'html { scroll-behavior: auto !important; }';
      document.head.append(style);
    });
    try { localStorage.clear(); } catch {}
  });

  const r = { device: device.name, width, height, interactions: {}, issues: [] };
  const issue = (msg) => r.issues.push(msg);
  const dir = `${OUT}/${device.name}`;
  await mkdir(dir, { recursive: true });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${dir}/01-intro.png` });

  // Intro: the names, seal and hint must all sit inside the first screen
  const intro = await page.evaluate(() => {
    const box = (s) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const b = e.getBoundingClientRect();
      return { x: b.x, y: b.y, width: b.width, height: b.height };
    };
    return { top: box('.intro__top'), seal: box('.intro__open'), hint: box('.intro__hint') };
  });
  for (const [k, b] of Object.entries(intro)) if (!inViewport(b, width, height)) issue(`Intro ${k} is outside the first screen: ${JSON.stringify(b)}`);
  r.interactions.intro = intro;

  await page.getByRole('button', { name: /open the invitation/i }).click();
  await page.locator('.intro').waitFor({ state: 'detached', timeout: 8000 });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${dir}/02-hero.png` });

  const hero = await page.evaluate(() => {
    const n = document.querySelector('.hero__names').getBoundingClientRect();
    const a = document.querySelector('.hero__arch').getBoundingClientRect();
    const d = document.querySelector('.hero__date').getBoundingClientRect();
    return { namesWidth: n.width, namesBottom: n.bottom, archWidth: a.width, dateBottom: d.bottom, heroHeight: document.querySelector('.hero').offsetHeight };
  });
  r.interactions.hero = hero;
  if (hero.namesWidth > hero.archWidth) issue('Hero names are wider than the arch');
  // On landscape screens the couple's names and the date should be visible without scrolling
  if (width >= 1024 && width > height && hero.dateBottom > height) issue(`Hero date is below the fold (bottom ${Math.round(hero.dateBottom)}px of ${height}px)`);

  await scrollThrough(page);
  r.measure = await page.evaluate(measure, SECTIONS);
  const m = r.measure;
  if (m.horizontalScroll) issue(`Horizontal scroll: page is ${m.scrollWidth}px in a ${m.viewportWidth}px viewport`);
  if (m.overflowing.length) issue(`${m.overflowing.length} element(s) extend past the viewport edge`);
  if (touch && m.smallTargets.length) issue(`${m.smallTargets.length} touch target(s) smaller than 44×44`);
  if (m.tinyText.length) issue(`${m.tinyText.length} text element(s) under 12px`);
  if (m.clippedText.length) issue(`${m.clippedText.length} clipped text element(s)`);
  if (Object.keys(m.overlaps).length) issue(`Text overlaps in: ${Object.keys(m.overlaps).join(', ')}`);
  if (m.images.broken.length) issue(`${m.images.broken.length} broken image(s)`);

  // Floating controls stay on screen
  const floating = await page.locator('.floating__button:visible').evaluateAll((els) =>
    els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; }));
  if (floating.some((b) => !inViewport(b, width, height))) issue('A floating control is outside the viewport');
  r.interactions.floatingControls = floating.length;

  await page.screenshot({ path: `${dir}/03-full-page.png`, fullPage: true });

  // Section screenshots
  for (const id of SECTIONS) {
    const loc = page.locator(`#${id}`);
    await loc.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${dir}/section-${id}.png` });
  }

  // Scratch card reveal
  await page.locator('#date').scrollIntoViewIfNeeded();
  const revealBtn = page.getByRole('button', { name: 'Reveal the date' });
  if (await revealBtn.isVisible()) {
    await revealBtn.click();
    await page.getByText(/See you in/).waitFor({ timeout: 4000 });
    r.interactions.scratchReveal = 'ok';
  } else issue('Reveal the date button not visible');

  // FAQ accordion
  const faq = page.locator('.faq__question button').first();
  await faq.scrollIntoViewIfNeeded();
  await faq.click();
  r.interactions.faq = (await faq.getAttribute('aria-expanded')) === 'true' ? 'ok' : 'failed';
  if (r.interactions.faq !== 'ok') issue('FAQ did not expand');

  // Gallery lightbox
  const thumb = page.locator('.gallery__button').first();
  await thumb.scrollIntoViewIfNeeded();
  await thumb.click();
  const lb = page.getByRole('dialog', { name: 'Photo viewer' });
  await lb.waitFor({ timeout: 5000 });
  await page.waitForTimeout(700);
  const lbBoxes = await page.evaluate(() => {
    const box = (s) => { const b = document.querySelector(s)?.getBoundingClientRect(); return b && { x: b.x, y: b.y, width: b.width, height: b.height }; };
    return { img: box('.lightbox__img'), caption: box('.lightbox__caption'), close: box('.lightbox__close'), prev: box('.lightbox__prev'), next: box('.lightbox__next') };
  });
  for (const [k, b] of Object.entries(lbBoxes)) if (!inViewport(b, width, height)) issue(`Lightbox ${k} is outside the viewport: ${JSON.stringify(b)}`);
  const ov = (a, b) => a && b && Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 2 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 2;
  for (const k of ['prev', 'next', 'close']) {
    if (ov(lbBoxes[k], lbBoxes.caption)) issue(`Lightbox ${k} button overlaps the caption`);
    if (ov(lbBoxes[k], lbBoxes.img)) issue(`Lightbox ${k} button overlaps the photo`);
  }
  await page.screenshot({ path: `${dir}/04-lightbox.png` });
  await page.getByRole('button', { name: 'Next photo' }).click();
  await page.waitForTimeout(300);
  const counter = await page.locator('.lightbox__caption .label').textContent();
  await page.keyboard.press('Escape');
  await lb.waitFor({ state: 'detached', timeout: 3000 });
  r.interactions.lightbox = counter.includes('2 /') ? 'ok' : `counter "${counter}"`;

  // RSVP: validation, then a full submission
  const form = page.locator('.rsvp__form');
  await form.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: /send rsvp/i }).click();
  const errorsShown = await page.locator('.field__error:not([hidden])').count();
  if (errorsShown < 3) issue(`RSVP showed ${errorsShown} validation errors on empty submit (expected 3)`);
  await page.screenshot({ path: `${dir}/05-rsvp-errors.png` });
  await page.getByLabel(/full name/i).fill('Priya Sharma');
  await page.getByLabel(/phone number/i).fill('+91 98765 43210');
  await page.locator('label.choice').first().click();
  await page.getByRole('button', { name: 'Add a guest' }).click();
  await page.getByRole('button', { name: 'Select all celebrations' }).click();
  await page.waitForTimeout(500); // let the chip colour transitions settle
  await page.screenshot({ path: `${dir}/06-rsvp-filled.png` });
  const rsvpBoxes = await page.evaluate(() => {
    const form = document.querySelector('.rsvp__form').getBoundingClientRect();
    return [...document.querySelectorAll('.rsvp__form .check, .rsvp__form .choice, .rsvp__form .stepper, .rsvp__submit')]
      .filter((e) => { const b = e.getBoundingClientRect(); return b.right > form.right + 1 || b.left < form.left - 1; })
      .map((e) => e.className);
  });
  if (rsvpBoxes.length) issue(`RSVP controls overflow the form: ${rsvpBoxes.join(', ')}`);
  await page.getByRole('button', { name: /send rsvp/i }).click();
  await page.getByTestId('rsvp-success').waitFor({ timeout: 6000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${dir}/07-rsvp-success.png` });
  r.interactions.rsvp = 'ok';

  // Footer
  await page.locator('.footer').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${dir}/08-footer.png` });

  r.errors = errors;
  if (errors.length) issue(`${errors.length} console/page/network error(s)`);
  await context.close();
  return r;
}

const browser = await chromium.launch();
const results = [];
for (const device of DEVICES) {
  try {
    const res = await auditDevice(browser, device);
    results.push(res);
    console.log(`${device.name}: ${res.issues.length ? res.issues.join(' | ') : 'no issues'}`);
  } catch (e) {
    results.push({ device: device.name, fatal: String(e.message).split('\n')[0] });
    console.log(`${device.name}: FATAL ${String(e.message).split('\n')[0]}`);
  }
}
await browser.close();
await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/results.json`, JSON.stringify(results, null, 2));
