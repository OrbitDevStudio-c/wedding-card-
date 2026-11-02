import { expect, test as base } from '@playwright/test';

// Smooth scrolling makes programmatic scrolls animate, which keeps elements "unstable" for clicks.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = 'html { scroll-behavior: auto !important; }';
        document.head.append(style);
      });
    });
    await use(page);
  },
});

export { expect };

export const SECTIONS = ['top', 'story', 'date', 'countdown', 'venue', 'events', 'gallery', 'travel', 'rsvp', 'blessings'];

export async function openInvite(page, path = '/') {
  await page.goto(path);
  await page.getByRole('button', { name: /open the invitation/i }).click();
  await expect(page.locator('.intro')).toHaveCount(0, { timeout: 8000 });
}

// Walks down the page so every scroll-triggered reveal and lazy section has fired.
export async function scrollThrough(page) {
  const step = await page.evaluate(() => window.innerHeight * 0.6);
  for (let y = 0; ; y += step) {
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    await page.evaluate((top) => window.scrollTo(0, top), Math.min(y, max));
    await page.waitForTimeout(80);
    if (y >= max) break;
  }
  await page.waitForTimeout(1500);
}

// Returns pairs of visible text elements whose boxes overlap inside the given section.
export function findTextOverlaps(page, selector) {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    const nodes = [...root.querySelectorAll('*')].filter((el) => {
      if (el.closest('[aria-hidden="true"], svg, canvas, .scratch')) return false;
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!hasText) return false;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
    });
    const textRect = (el) => {
      // Measure the glyphs themselves rather than the box, which can include generous line-height
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect();
    };
    const overlaps = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        if (a.contains(b) || b.contains(a)) continue;
        const ra = textRect(a);
        const rb = textRect(b);
        const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (x > 4 && y > 4) overlaps.push(`${a.textContent.trim().slice(0, 30)} ⟷ ${b.textContent.trim().slice(0, 30)}`);
      }
    }
    return overlaps;
  }, selector);
}
