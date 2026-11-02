import AxeBuilder from '@axe-core/playwright';
import { findTextOverlaps, openInvite, scrollThrough, SECTIONS, expect, test } from './helpers.js';

test('every section renders and is visible', async ({ page }) => {
  await openInvite(page);
  for (const id of SECTIONS) {
    const section = page.locator(`#${id}`);
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    await expect(section.locator('h1, h2').first()).toBeVisible();
  }
  await expect(page.locator('footer')).toContainText('OrbitDevStudio');
  await expect(page.locator('footer').getByRole('link', { name: 'OrbitDevStudio' })).toHaveAttribute(
    'href',
    'https://orbit-dev-studio.vercel.app/',
  );
  await expect(page.locator('#gallery .gallery__item')).toHaveCount(6);
});

test('no console errors on load, open and scroll', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));
  await openInvite(page);
  await scrollThrough(page);
  expect(errors).toEqual([]);
});

test('no horizontal overflow at any scroll position', async ({ page }) => {
  await openInvite(page);
  await scrollThrough(page);
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
});

test.describe('reduced motion layout', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no overlapping text in key sections', async ({ page }) => {
    await openInvite(page, '/?guest=Priya');
    await scrollThrough(page);
    for (const id of SECTIONS) {
      expect(await findTextOverlaps(page, `#${id}`), `overlaps in #${id}`).toEqual([]);
    }
  });
});

test('intro has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
});

test('opened invitation has no accessibility violations', async ({ page }) => {
  await openInvite(page);
  await scrollThrough(page);
  // Off-screen sections use content-visibility:auto and are not rendered, so axe cannot
  // resolve their backgrounds; render everything for the audit.
  await page.addStyleTag({ content: '.section { content-visibility: visible !important; }' });
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
});

test('full-page screenshot', async ({ page }, testInfo) => {
  await openInvite(page, '/?guest=Priya');
  await scrollThrough(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `screenshots/${testInfo.project.name}.png`, fullPage: true });
});
