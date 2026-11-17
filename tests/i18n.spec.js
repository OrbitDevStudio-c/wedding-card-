import AxeBuilder from '@axe-core/playwright';
import { expect, findTextOverlaps, openInvite, scrollThrough, SECTIONS, test } from './helpers.js';
import { coupleClient, createGift, uid } from './gifts/helpers.js';

// English ⇄ ગુજરાતી. The switcher is two toggle buttons: [ EN | ગુજરાતી ].
const toGujarati = (page) => page.getByTestId('lang-gu').click();
const toEnglish = (page) => page.getByTestId('lang-en').click();
const isGujarati = (page) => expect(page.locator('html')).toHaveAttribute('lang', 'gu');

test.describe('language switching on the invitation', () => {
  test('English is the default and the switcher reflects it', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('lang-en')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('lang-gu')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.intro__eyebrow')).toHaveText('You are invited to the wedding of');
  });

  test('switches to Gujarati and back instantly, without a reload, keeping the guest greeting', async ({ page }) => {
    await page.goto('/?guest=priya%20sharma');
    const marker = await page.evaluate(() => (window.__noReload = Math.random()));
    await toGujarati(page);
    await isGujarati(page);
    await expect(page.locator('.intro__eyebrow')).toHaveText('આપને સપ્રેમ આમંત્રણ છે, શુભ લગ્નોત્સવમાં');
    await expect(page.locator('.intro__greeting')).toHaveText('પ્રિય Priya Sharma,');
    await expect(page.getByRole('button', { name: 'આમંત્રણ ખોલવા માટે મહોર તોડો' })).toBeVisible();

    await page.getByRole('button', { name: 'આમંત્રણ ખોલવા માટે મહોર તોડો' }).click();
    await expect(page.locator('.intro')).toHaveCount(0, { timeout: 8000 });
    await expect(page.locator('.hero__greeting')).toHaveText('પ્રિય Priya Sharma,');
    await expect(page.locator('#story h2')).toHaveText('અમારી કહાણી');
    // Names, dates and venue stay accurate
    await expect(page.locator('#hero-title')).toContainText('Alica');
    await expect(page.locator('#hero-title')).toContainText('Rushil');
    await expect(page.locator('.hero__date')).toContainText('12 – 13 ફેબ્રુઆરી 2027');

    await toEnglish(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('#story h2')).toHaveText('Our Story');
    await expect(page.locator('.hero__greeting')).toHaveText('Dear Priya Sharma,');
    expect(await page.evaluate(() => window.__noReload)).toBe(marker);
  });

  test('the switcher works from the keyboard and announces its state', async ({ page }) => {
    await page.goto('/');
    const gu = page.getByTestId('lang-gu');
    await gu.focus();
    await page.keyboard.press('Enter');
    await isGujarati(page);
    await expect(gu).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('group', { name: 'ભાષા' })).toBeVisible();
    await expect(gu).toHaveAttribute('lang', 'gu');
  });

  test('the choice persists after a refresh and across pages', async ({ page }) => {
    await page.goto('/');
    await toGujarati(page);
    await isGujarati(page);
    await page.reload();
    await isGujarati(page);
    await expect(page.locator('.intro__eyebrow')).toHaveText('આપને સપ્રેમ આમંત્રણ છે, શુભ લગ્નોત્સવમાં');

    await page.goto('/gifts');
    await isGujarati(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('તમારી હાજરી એ જ અમારો સૌથી મોટો ઉપહાર છે');
  });

  test('every section is translated, with nothing left in English', async ({ page }) => {
    await page.goto('/?lang=gu');
    await page.getByRole('button', { name: 'આમંત્રણ ખોલવા માટે મહોર તોડો' }).click();
    await expect(page.locator('.intro')).toHaveCount(0, { timeout: 8000 });
    const expected = {
      story: 'અમારી કહાણી',
      date: 'જ્યારે અમે “હા” કહીશું',
      countdown: 'શુભ ઘડીની રાહ',
      venue: 'લગ્નસ્થળ',
      events: 'શુભ પ્રસંગો',
      gallery: 'યાદગાર પળો',
      travel: 'પ્રવાસ અને રોકાણ',
      gifts: 'લગ્ન ભેટ',
      rsvp: 'શું આપ પધારશો?',
      blessings: 'આભાર',
    };
    for (const [id, title] of Object.entries(expected)) {
      await expect(page.locator(`#${id} h2`)).toHaveText(title);
    }
    await expect(page.locator('[data-event="mehendi"] .event-card__name')).toHaveText('મહેંદી');
    await expect(page.locator('[data-unit="days"] .countdown__label')).toHaveText('દિવસ');
    await expect(page.locator('footer')).toContainText('OrbitDevStudio');
    await expect(page.locator('footer')).toContainText('ભારતમાં');
  });

  test('content without a Gujarati translation falls back to English', async ({ page }) => {
    // The venue name and address are deliberately not translated in content.gu.js
    await page.goto('/?lang=gu');
    await page.getByRole('button', { name: 'આમંત્રણ ખોલવા માટે મહોર તોડો' }).click();
    await expect(page.locator('.intro')).toHaveCount(0, { timeout: 8000 });
    await page.locator('#venue').scrollIntoViewIfNeeded();
    await expect(page.locator('.venue__name')).toHaveText('The Aranya Palace Resort');
    await expect(page.locator('.venue__address')).toContainText('14 Lake Pichola Road');
    await expect(page.locator('.venue__address')).toContainText('ઉદયપુર');
  });
});

test.describe('RSVP in both languages', () => {
  test('validation messages follow the language, and typed answers survive a switch', async ({ page }) => {
    await openInvite(page);
    await page.locator('#rsvp').scrollIntoViewIfNeeded();
    await page.locator('#rsvp-phone').fill('12');
    await page.getByRole('button', { name: /send rsvp/i }).click();
    await expect(page.locator('#rsvp-name-error')).toHaveText('Please enter your full name.');
    await expect(page.locator('#rsvp-phone-error')).toHaveText('Please enter a valid 10-digit phone number.');

    await toGujarati(page);
    await expect(page.locator('#rsvp-name-error')).toHaveText('કૃપા કરી આપનું પૂરું નામ લખો.');
    await expect(page.locator('#rsvp-phone-error')).toHaveText('કૃપા કરી 10 અંકનો સાચો ફોન નંબર લખો.');
    await expect(page.locator('#rsvp-phone')).toHaveValue('12');

    await page.locator('#rsvp-name').fill('Priya Sharma');
    await page.locator('#rsvp-phone').fill('9876543210');
    await page.getByText('આનંદથી પધારીશું').click();
    await page.getByRole('checkbox', { name: 'મહેંદી' }).check({ force: true });
    await toEnglish(page);
    // The chosen celebration is kept by id, so it is still ticked in English
    await expect(page.getByRole('checkbox', { name: 'Mehendi' })).toBeChecked();
    await toGujarati(page);
    await page.getByRole('button', { name: 'RSVP મોકલો' }).click();
    await expect(page.getByTestId('rsvp-success')).toContainText('આભાર, Priya!');
  });
});

test.describe('Wedding Gifts in both languages', () => {
  let couple;
  test.beforeAll(async () => {
    couple = await coupleClient();
  });
  test.afterAll(async () => couple.dispose());

  test('reservation form: Gujarati validation and success, with the gift translated', async ({ page }) => {
    const english = `Brass Diya Set ${uid()}`;
    const gujarati = `પિત્તળનો દીવા સેટ ${uid()}`;
    await createGift(couple, { name: english, translations: { gu: { name: gujarati, description: 'પૂજા ઘર માટે.' } } });
    await page.goto('/gifts?lang=gu&guest=Aarav');
    await isGujarati(page);
    const card = page.getByTestId('gift-card').filter({ hasText: gujarati });
    await expect(card).toContainText('પૂજા ઘર માટે.');
    await card.getByRole('button', { name: `આ ભેટ પસંદ કરો: ${gujarati}` }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('કોણે કઈ ભેટ પસંદ કરી છે તે ફક્ત વર-વધૂ જ જોઈ શકે છે.');
    await expect(dialog.getByLabel('આપનું નામ')).toHaveValue('Aarav');
    await dialog.getByLabel('આપનું નામ').fill('');
    await dialog.getByRole('button', { name: 'ભેટની પસંદગી પાકી કરો' }).click();
    await expect(dialog.getByText('કૃપા કરી આપનું નામ લખો.')).toBeVisible();

    await dialog.getByLabel('આપનું નામ').fill('Aarav Shah');
    await dialog.getByRole('button', { name: 'ભેટની પસંદગી પાકી કરો' }).click();
    await expect(dialog.getByRole('heading', { name: 'અમારો દિવસ ખાસ બનાવવા બદલ આભાર!' })).toBeVisible();
    // Prices never change with language
    await expect(page.locator('body')).not.toContainText('NaN');
  });

  test('a gift with no Gujarati translation shows its English text', async ({ page }) => {
    const name = `Untranslated Lamp ${uid()}`;
    await createGift(couple, { name, description: 'English only description.', category: 'home' });
    await page.goto('/gifts?lang=gu');
    const card = page.getByTestId('gift-card').filter({ hasText: name });
    await expect(card).toContainText('English only description.');
    await expect(card).toContainText('ઘર અને સજાવટ');
    await expect(card.getByRole('button', { name: `આ ભેટ પસંદ કરો: ${name}` })).toBeVisible();
  });

  test('language is kept between the invitation and the gift page, with the guest', async ({ page }) => {
    await page.goto('/?guest=meera&lang=gu');
    await page.getByRole('button', { name: 'આમંત્રણ ખોલવા માટે મહોર તોડો' }).click();
    await expect(page.locator('.intro')).toHaveCount(0, { timeout: 8000 });
    await page.locator('#gifts').scrollIntoViewIfNeeded();
    await page.locator('#gifts').getByRole('link', { name: 'અમારી ભેટોની યાદી જુઓ' }).click();
    await expect(page).toHaveURL(/\/gifts\?guest=Meera$/);
    await isGujarati(page);
    await expect(page.locator('.gifts-hero__greeting')).toHaveText('પ્રિય Meera,');
    await page.getByRole('link', { name: /પાછા/ }).click();
    await isGujarati(page);
  });
});

test.describe('Gujarati at phone widths', () => {
  test.use({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' });

  test('the invitation in Gujarati has no overflow or overlapping text', async ({ page }) => {
    await page.goto('/?lang=gu&guest=Priya');
    await page.getByRole('button', { name: 'આમંત્રણ ખોલવા માટે મહોર તોડો' }).click();
    await expect(page.locator('.intro')).toHaveCount(0, { timeout: 8000 });
    await scrollThrough(page);
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    for (const id of SECTIONS) {
      expect(await findTextOverlaps(page, `#${id}`), `overlaps in #${id}`).toEqual([]);
    }
    // Gujarati glyphs come from the self-hosted Noto Serif Gujarati, not a system fallback
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].some((f) => f.family.includes('Noto Serif Gujarati') && f.status === 'loaded');
    });
    expect(loaded).toBe(true);
  });

  test('the gift page in Gujarati fits and passes accessibility checks', async ({ page }) => {
    await page.goto('/gifts?lang=gu');
    await expect(page.getByTestId('gift-card').first()).toBeVisible();
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    expect(await findTextOverlaps(page, '#wishlist')).toEqual([]);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
  });
});
