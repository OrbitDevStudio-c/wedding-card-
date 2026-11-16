import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../helpers.js';
import { SLUG } from './env.js';
import { W, checkoutSignature, coupleClient, createDream, createGift, uid } from './helpers.js';

const SITE_URL = 'https://alica-weds-rushil.vercel.app';
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

let couple;
test.beforeAll(async () => {
  couple = await coupleClient();
});
test.afterAll(async () => couple.dispose());

async function noHorizontalOverflow(page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

const card = (page, name) => page.getByTestId('gift-card').filter({ has: page.getByRole('heading', { name, exact: true }) });

async function axe(page) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
}

// A stand-in for Razorpay Checkout: "pays" instantly, signing with the test secret through a
// function exposed from the test process (or forging the signature when asked).
async function fakeCheckout(page, { forge = false } = {}) {
  await page.exposeFunction('__signPayment', (orderId, paymentId) => (forge ? 'f'.repeat(64) : checkoutSignature(orderId, paymentId)));
  await page.route('https://checkout.razorpay.com/**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.Razorpay = function (opts) {
        this.on = function () {};
        this.open = async function () {
          var pid = 'pay_ui_' + Math.random().toString(16).slice(2);
          var sig = await window.__signPayment(opts.order_id, pid);
          opts.handler({ razorpay_order_id: opts.order_id, razorpay_payment_id: pid, razorpay_signature: sig });
        };
      };`,
    }),
  );
}

test.describe('invitation entry point', () => {
  test('the invitation links to the gift page and keeps the guest name', async ({ page }) => {
    await page.goto('/?guest=priya%20sharma');
    await page.getByRole('button', { name: /open the invitation/i }).click();
    const section = page.locator('#gifts');
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole('heading', { name: 'Wedding Gifts' })).toBeVisible();
    await section.getByRole('link', { name: /view our wishlist/i }).click();
    await expect(page).toHaveURL(/\/gifts\?guest=Priya%20Sharma$/);
    await expect(page.locator('.gifts-hero__greeting')).toHaveText('Dear Priya Sharma,');
    await expect(page.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/?guest=Priya%20Sharma');
  });
});

test.describe('gift page', () => {
  test('hero, wishlist and dreams render without overflow or accessibility issues', async ({ page }) => {
    await page.goto('/gifts');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your Presence Is Our Greatest Gift');
    await expect(page.getByTestId('gift-card').first()).toBeVisible();
    await expect(page.getByTestId('dream-card').first()).toBeVisible();
    await noHorizontalOverflow(page);
    await axe(page);
  });

  test('gift details, safe store links and category filters', async ({ page }) => {
    const name = `Filter Lamp ${uid()}`;
    await createGift(couple, { name, category: 'experiences', estimatedPrice: 35000, purchaseUrl: 'https://example.com/lamp' });
    await page.goto('/gifts');
    const c = card(page, name);
    await expect(c).toContainText('₹35,000');
    await expect(c).toContainText('Experiences');
    const link = c.getByRole('link', { name: /view in store/i });
    await expect(link).toHaveAttribute('href', 'https://example.com/lamp');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link).toHaveAttribute('rel', /noreferrer/);

    await page.getByRole('button', { name: 'Experiences', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Experiences', exact: true })).toHaveAttribute('aria-pressed', 'true');
    const categories = await page.getByTestId('gift-card').locator('.gift-card__category').allInnerTexts();
    expect(categories.length).toBeGreaterThan(0);
    expect(new Set(categories.map((t) => t.toLowerCase()))).toEqual(new Set(['experiences']));
    await page.getByRole('button', { name: 'All gifts' }).click();
    await expect(page.getByRole('button', { name: 'Electronics' })).toBeVisible();
  });

  test('reserving a gift: validation, privacy notice, success, and it leaves the wishlist', async ({ page }) => {
    const name = `Reserve Me ${uid()}`;
    const gift = await createGift(couple, { name });
    await page.goto('/gifts?guest=Aarav');
    await card(page, name).getByRole('button', { name: /reserve this gift/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name })).toBeVisible();
    await expect(dialog).toContainText('Only the wedding couple can see who selected this gift.');
    await expect(dialog.getByLabel('Your name')).toHaveValue('Aarav');
    await noHorizontalOverflow(page);
    await axe(page);

    await dialog.getByLabel('Your name').fill('');
    await dialog.getByLabel(/phone/i).fill('not a phone');
    await dialog.getByRole('button', { name: 'Confirm Gift Reservation' }).click();
    await expect(dialog.getByText('Please enter your name.')).toBeVisible();
    await expect(dialog.getByText('Please enter a valid phone number.')).toBeVisible();

    await dialog.getByLabel('Your name').fill('Aarav Shah');
    await dialog.getByLabel(/phone/i).fill('+91 98765 43210');
    await dialog.getByLabel(/note for the couple/i).fill('Congratulations, you two!');
    await dialog.getByRole('button', { name: 'Confirm Gift Reservation' }).click();
    await expect(dialog.getByRole('heading', { name: 'Thank You for Making Their Day Special!' })).toBeVisible();
    await expect(dialog).toContainText('You can now purchase it from your preferred store');
    await expect(dialog).not.toContainText(/purchased/i);
    await dialog.getByRole('button', { name: 'Back to the wishlist' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(card(page, name)).toHaveCount(0);

    // Private details went to the couple, and nowhere public
    const r = (await (await couple.get('/api/couple/reservations?status=active')).json()).reservations.find((x) => x.giftId === gift.id);
    expect(r).toMatchObject({ guestName: 'Aarav Shah', guestPhone: '+91 98765 43210', message: 'Congratulations, you two!' });
    expect(await page.content()).not.toContain('98765');
  });

  test('if someone else reserves first, the guest is told kindly', async ({ page }) => {
    const name = `Contested ${uid()}`;
    const gift = await createGift(couple, { name });
    await page.goto('/gifts');
    await card(page, name).getByRole('button', { name: /reserve this gift/i }).click();
    await page.request.post(`${W}/gifts/${gift.id}/reservations`, { data: { guestName: 'Faster Guest' } });
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Your name').fill('Slower Guest');
    await dialog.getByRole('button', { name: 'Confirm Gift Reservation' }).click();
    await expect(dialog.getByRole('heading', { name: 'Just missed it' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Choose another gift' }).click();
    await expect(card(page, name)).toHaveCount(0);
  });

  test('Escape closes the reservation dialog and returns focus', async ({ page }) => {
    const name = `Escape ${uid()}`;
    await createGift(couple, { name });
    await page.goto('/gifts');
    const button = card(page, name).getByRole('button', { name: /reserve this gift/i });
    await button.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(button).toBeFocused();
  });
});

test.describe('dreams', () => {
  test('a dream page shows progress and a verified payment raises the total', async ({ page }) => {
    const dream = await createDream(couple, { targetAmount: 50000, offlineAmount: 10000 });
    await fakeCheckout(page);
    await page.goto(`/gifts/dream/${dream.slug}?guest=Meera`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(dream.title);
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20');
    await noHorizontalOverflow(page);
    await axe(page);

    await expect(page.getByLabel('Your name')).toHaveValue('Meera');
    await page.getByRole('button', { name: '₹5,100' }).click();
    await page.getByRole('button', { name: /contribute ₹5,100/i }).click();
    await expect(page.getByRole('heading', { name: 'Thank you for this beautiful gift!' })).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30.2');
  });

  test('a forged payment shows an error and changes nothing', async ({ page }) => {
    const dream = await createDream(couple);
    await fakeCheckout(page, { forge: true });
    await page.goto(`/gifts/dream/${dream.slug}`);
    await page.getByLabel('Your name').fill('Forger');
    await page.getByRole('button', { name: /contribute/i }).click();
    await expect(page.getByRole('alert')).toContainText('could not verify');
    const fresh = await (await page.request.get(`${W}/dreams/${dream.slug}`)).json();
    expect(fresh.dream.raisedAmount).toBe(0);
  });

  test('contribution form validates name and amount', async ({ page }) => {
    const dream = await createDream(couple);
    await page.goto(`/gifts/dream/${dream.slug}`);
    await page.getByLabel('Amount in rupees').fill('5');
    await page.getByRole('button', { name: /contribute/i }).click();
    await expect(page.getByText('Please enter your name.')).toBeVisible();
    await expect(page.getByText(/choose an amount between/i)).toBeVisible();
  });

  test('demo mode is clearly labelled and never claims a payment', async ({ page }) => {
    // UI-only check of the demo presentation: the API under test runs with (fake) payments enabled.
    await page.route(`**${W}`, async (route) => {
      const res = await route.fetch();
      const json = await res.json();
      await route.fulfill({ response: res, json: { ...json, payments: { mode: 'demo', min: 100, max: 500000 } } });
    });
    await page.route(`**${W}/dreams/*/contributions`, (route) => route.fulfill({ status: 201, json: { mode: 'demo' } }));
    await page.goto('/gifts/dream/switzerland-honeymoon');
    await expect(page.getByTestId('demo-notice')).toContainText('no money will be taken');
    await page.getByLabel('Your name').fill('Demo Guest');
    await page.getByRole('button', { name: /pledge/i }).click();
    await expect(page.getByTestId('contribute-success')).toContainText('no payment was taken');
  });

  test('an unknown dream shows a friendly page', async ({ page }) => {
    await page.goto('/gifts/dream/does-not-exist');
    await expect(page.getByRole('heading', { name: 'Dream not found' })).toBeVisible();
  });
});

test.describe('couple dashboard', () => {
  test('signed-out visitors only see the login form', async ({ page }) => {
    await page.goto('/couple/dashboard/reservations');
    await expect(page).toHaveURL(/\/couple\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Reserved by');
    await axe(page);

    await page.getByLabel('Email').fill('couple@test.local');
    await page.getByLabel('Password').fill('wrong password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toContainText('do not match');
  });

  test('login, view a private reservation with its message, and release it', async ({ page }) => {
    const name = `Dashboard Gift ${uid()}`;
    const gift = await createGift(couple, { name });
    await page.request.post(`${W}/gifts/${gift.id}/reservations`, {
      data: { guestName: 'Priya Patel', guestPhone: '9876543210', message: 'For your new kitchen' },
    });

    await page.goto('/couple/login');
    await page.getByLabel('Email').fill('couple@test.local');
    await page.getByLabel('Password').fill('correct horse battery staple');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/couple\/dashboard$/);
    await expect(page.getByTestId('stats')).toContainText('Reserved');
    await noHorizontalOverflow(page);
    await axe(page);

    await page.getByRole('link', { name: 'Reservations', exact: true }).click();
    const row = page.getByTestId('reservation-row').filter({ hasText: name });
    await expect(row).toContainText('Priya Patel');
    await expect(row).toContainText('9876543210');
    await expect(row).toContainText('For your new kitchen');
    await noHorizontalOverflow(page);

    await row.getByRole('button', { name: 'Release' }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm.getByRole('heading', { name: 'Release this reservation?' })).toBeVisible();
    await confirm.getByRole('button', { name: 'Release gift' }).click();
    await expect(page.getByTestId('reservation-row').filter({ hasText: name })).toHaveCount(0);

    const publicGifts = (await (await page.request.get(`${W}/gifts`)).json()).gifts;
    expect(publicGifts.some((g) => g.id === gift.id)).toBe(true);
  });

  test('add and edit a gift from the dashboard', async ({ page }) => {
    await page.request.post('/api/auth/login', { data: { email: 'couple@test.local', password: 'correct horse battery staple' } });
    await page.goto('/couple/dashboard/wishlist');
    const name = `Added In UI ${uid()}`;
    await page.getByRole('button', { name: 'Add a gift' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Add gift' }).click();
    await expect(dialog.getByText(/please name the gift/i)).toBeVisible();
    await dialog.getByLabel('Product name').fill(name);
    await dialog.getByLabel('Estimated price (₹)').fill('7500');
    await dialog.getByLabel('Category').selectOption('home');
    await dialog.getByLabel(/where to buy/i).fill('https://example.com/item');
    await dialog.getByRole('button', { name: 'Add gift' }).click();
    const item = page.getByTestId('manage-gift').filter({ hasText: name });
    await expect(item).toContainText('₹7,500');
    await noHorizontalOverflow(page);

    await item.getByRole('button', { name: /^Edit/ }).click();
    await page.getByRole('dialog').getByLabel('Estimated price (₹)').fill('8000');
    await page.getByRole('dialog').getByRole('button', { name: 'Save changes' }).click();
    await expect(item).toContainText('₹8,000');

    await page.goto('/gifts');
    await expect(card(page, name)).toContainText('₹8,000');
  });

  test('QR codes encode the deployed domain and resolve to real pages', async ({ page }) => {
    await page.request.post('/api/auth/login', { data: { email: 'couple@test.local', password: 'correct horse battery staple' } });
    await page.goto('/couple/dashboard/share');
    const cards = page.getByTestId('qr-card');
    await expect(cards.first().getByTestId('qr-image')).toBeVisible();
    await expect(cards.first()).toHaveAttribute('data-url', `${SITE_URL}/gifts`);
    const swiss = cards.filter({ hasText: 'Our Switzerland Honeymoon' });
    await expect(swiss).toHaveAttribute('data-url', `${SITE_URL}/gifts/dream/switzerland-honeymoon`);
    await expect(swiss.getByTestId('qr-image')).toHaveAttribute('src', /^data:image\/png;base64,/);
    await noHorizontalOverflow(page);
    const download = page.waitForEvent('download');
    await swiss.getByRole('button', { name: 'Download SVG' }).click();
    expect((await download).suggestedFilename()).toBe('dream-switzerland-honeymoon.svg');

    // The path inside each code opens the matching page on this site
    await page.goto('/gifts/dream/switzerland-honeymoon');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Our Switzerland Honeymoon');
    expect(SLUG).toBe('alica-rushil');
  });
});
