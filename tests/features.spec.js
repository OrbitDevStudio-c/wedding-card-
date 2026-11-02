import { readFile } from 'node:fs/promises';
import { openInvite, expect, test } from './helpers.js';

const audioPaused = (page) => page.evaluate(() => document.querySelector('audio').paused);

test('tapping the seal opens the invite and starts music; toggle mutes and unmutes', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('audio')).not.toHaveAttribute('src');
  await openInvite(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Alica');
  await expect(page.locator('audio')).toHaveAttribute('src', /wedding-theme\.mp3/);
  await expect.poll(() => audioPaused(page)).toBe(false);

  const toggle = page.locator('.floating__music');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => audioPaused(page)).toBe(true);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => audioPaused(page)).toBe(false);
});

test('guest name from the URL personalises the invite and RSVP', async ({ page }) => {
  await page.goto('/?guest=priya%20sharma');
  await expect(page.locator('.intro__greeting')).toHaveText('Dear Priya Sharma,');
  await page.getByRole('button', { name: /open the invitation/i }).click();
  await expect(page.locator('.hero__greeting')).toHaveText('Dear Priya Sharma,');
  await expect(page.locator('#rsvp-name')).toHaveValue('Priya Sharma');
});

test('scratching the gold leaf reveals the date', async ({ page }) => {
  await openInvite(page);
  const canvas = page.getByTestId('scratch-canvas');
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1300);
  const box = await canvas.boundingBox();
  // Press inside the arch (its rounded corners are clipped), then sweep the whole card
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 10, box.y + 10, { steps: 8 });
  for (let y = 10; y < box.height; y += 36) {
    await page.mouse.move(box.x + box.width - 10, box.y + y, { steps: 8 });
    await page.mouse.move(box.x + 10, box.y + y + 18, { steps: 8 });
  }
  await page.mouse.up();
  await expect(page.locator('#date .scratch')).toHaveClass(/is-revealed/);
  await expect(page.locator('.date-reveal__done')).toHaveText('See you in Udaipur!');
});

test('reveal button is an accessible fallback for scratching', async ({ page }) => {
  await openInvite(page);
  await page.getByRole('button', { name: 'Reveal the date' }).click();
  await expect(page.locator('#date .scratch')).toHaveClass(/is-revealed/);
  await expect(page.locator('#date [aria-live]')).toContainText('Date revealed');
});

test('countdown shows correct values and ticks every second', async ({ page }) => {
  // Exactly 11 days before the Mehendi begins (11:00 IST on 12 Feb 2027)
  const target = new Date('2027-02-01T11:00:00+05:30').getTime();
  await page.clock.install({ time: target - 30_000 });
  await page.goto('/');
  // Sections mount in idle callbacks, so let them appear before freezing time
  await page.locator('#countdown').waitFor({ state: 'attached' });
  // Freeze just after the whole second so the 5ms-late tick has rendered it
  await page.clock.pauseAt(target + 10);
  const value = (unit) => page.locator(`[data-unit="${unit}"] .countdown__num`);
  await expect(value('days')).toHaveText('11');
  await expect(value('hours')).toHaveText('00');
  await expect(value('minutes')).toHaveText('00');
  await expect(value('seconds')).toHaveText('00');

  await page.clock.runFor(1100);
  await expect(value('days')).toHaveText('10');
  await expect(value('hours')).toHaveText('23');
  await expect(value('minutes')).toHaveText('59');
  await expect(value('seconds')).toHaveText('59');

  await page.clock.runFor(1000);
  await expect(value('seconds')).toHaveText('58');
});

test('location, calendar and share links are correct', async ({ page }) => {
  await openInvite(page);

  const maps = await page.getByTestId('view-location').getAttribute('href');
  expect(maps).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  expect(decodeURIComponent(maps)).toContain('The Aranya Palace Resort, 14 Lake Pichola Road, Udaipur 313001');

  const google = new URL(await page.getByTestId('google-calendar').getAttribute('href'));
  expect(google.origin + google.pathname).toBe('https://calendar.google.com/calendar/render');
  expect(google.searchParams.get('action')).toBe('TEMPLATE');
  expect(google.searchParams.get('dates')).toBe('20270212T053000Z/20270213T180000Z');
  expect(google.searchParams.get('text')).toBe("Alica & Rushil's Wedding");

  const ics = page.getByTestId('ics-download');
  await ics.scrollIntoViewIfNeeded();
  const [download] = await Promise.all([page.waitForEvent('download'), ics.click()]);
  expect(download.suggestedFilename()).toBe('alica-rushil-wedding.ics');
  const content = await readFile(await download.path(), 'utf8');
  expect(content).toContain('BEGIN:VCALENDAR');
  expect(content.match(/BEGIN:VEVENT/g)).toHaveLength(5);
  expect(content).toContain('DTSTART:20270212T053000Z');

  const whatsapp = await page.locator('.floating__whatsapp').getAttribute('href');
  expect(whatsapp).toMatch(/^https:\/\/wa\.me\/\?text=/);
  const text = decodeURIComponent(whatsapp.split('text=')[1]);
  expect(text).toContain('Alica & Rushil');
  expect(text).toMatch(/https:\/\/\S+/);
});

test('gallery lightbox opens, navigates and closes', async ({ page }) => {
  await openInvite(page);
  await page.locator('#gallery').scrollIntoViewIfNeeded();
  const first = page.locator('.gallery__button').first();
  await first.click();
  const dialog = page.getByRole('dialog', { name: 'Photo viewer' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('1 / 6');
  await expect(page.getByRole('button', { name: 'Close photo viewer' })).toBeFocused();

  await dialog.getByRole('button', { name: 'Next photo' }).click();
  await expect(dialog).toContainText('2 / 6');
  await page.keyboard.press('ArrowRight');
  await expect(dialog).toContainText('3 / 6');
  await dialog.getByRole('button', { name: 'Previous photo' }).click();
  await expect(dialog).toContainText('2 / 6');

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(first).toBeFocused();

  await first.click();
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Close photo viewer' }).click();
  await expect(dialog).toHaveCount(0);
});

test('FAQ accordion expands and collapses', async ({ page }) => {
  await openInvite(page);
  const question = page.getByRole('button', { name: 'What will the weather be like?' });
  await question.scrollIntoViewIfNeeded();
  const panel = page.getByRole('region', { name: 'What will the weather be like?' });
  await expect(question).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('25°C');
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
});

test('RSVP shows validation errors, then a success state on valid submit', async ({ page }) => {
  await openInvite(page);
  const submit = page.getByRole('button', { name: 'Send RSVP' });
  await submit.scrollIntoViewIfNeeded();
  await submit.click();

  await expect(page.locator('#rsvp-name-error')).toHaveText('Please enter your full name.');
  await expect(page.locator('#rsvp-phone-error')).toHaveText('Please enter your phone number.');
  await expect(page.locator('#rsvp-attending-error')).toHaveText('Please let us know if you can make it.');
  await expect(page.locator('#rsvp-name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#rsvp-name')).toBeFocused();

  await page.locator('#rsvp-name').fill('Priya Sharma');
  await page.locator('#rsvp-phone').fill('12345');
  await page.locator('#rsvp-phone').blur();
  await expect(page.locator('#rsvp-phone-error')).toHaveText('Please enter a valid 10-digit phone number.');
  await page.locator('#rsvp-phone').fill('+91 98765 43210');
  await expect(page.locator('#rsvp-phone-error')).toBeHidden();

  await page.getByRole('radio', { name: /Joyfully accept/ }).check();
  await submit.click();
  await expect(page.locator('#rsvp-events-error')).toHaveText('Pick at least one celebration.');

  await page.getByRole('button', { name: 'Add a guest' }).click();
  await page.getByRole('checkbox', { name: 'Sangeet' }).check();
  await page.getByRole('checkbox', { name: 'Wedding Pheras' }).check();
  await page.locator('#rsvp-message').fill('So happy for you both!');
  await submit.click();

  await expect(page.getByRole('button', { name: /Sending/ })).toBeDisabled();
  const success = page.getByTestId('rsvp-success');
  await expect(success).toBeVisible({ timeout: 5000 });
  await expect(success.getByRole('heading')).toHaveText('Thank you, Priya!');
  await expect(success).toContainText('your party of 2');

  await page.reload();
  await page.getByRole('button', { name: /open the invitation/i }).click();
  await expect(page.getByTestId('rsvp-success')).toBeAttached();
});
