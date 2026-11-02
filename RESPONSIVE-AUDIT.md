# Responsive Audit — Alica & Rushil Wedding Invitation

**Date:** 1 November 2026
**Build tested:** production build (`vite build`) served by `vite preview`
**Browser:** Chromium (Playwright 1.64.1, Chromium revision 1248), headless
**Tool:** [`scripts/responsive-audit.mjs`](scripts/responsive-audit.mjs) — re-run any time with `npm run preview`, then `npm run audit:responsive -- <label>`

## Summary

The site was already in good shape. At every size there was no horizontal scrolling, no broken images, no console errors, and every interactive flow worked. The audit still found **7 layout and readability problems**. All 7 are fixed and re-tested. After the fixes, **all 8 device sizes pass every automated check**, and the screenshots were reviewed by eye.

| Device | Size | Before | After |
|---|---|---|---|
| Small mobile | 320 × 568 | 11 labels under 12px · lightbox buttons over caption · cramped story text · floating buttons over text · wrapped calendar button | ✅ Pass |
| Standard mobile | 375 × 812 | 11 labels under 12px · cramped story text · floating buttons over text | ✅ Pass |
| iPhone-sized | 390 × 844 | 7 labels under 12px · floating buttons over text | ✅ Pass |
| Large mobile | 430 × 932 | 7 labels under 12px | ✅ Pass |
| Tablet portrait | 768 × 1024 | 7 labels under 12px · lightbox buttons over caption | ✅ Pass |
| Tablet landscape | 1024 × 768 | 7 labels under 12px · couple's names cut off at the fold | ✅ Pass |
| Laptop | 1366 × 768 | 7 labels under 12px · names cut off at the fold · travel card misaligned | ✅ Pass |
| Desktop | 1920 × 1080 | 7 labels under 12px | ✅ Pass |

## What was tested at every size

The script does not just load the page. At each size it:

1. Loads the intro and checks that the names, the wax seal and "Tap the seal to open" all sit inside the first screen.
2. Taps the seal, waits for the doors to open, then scrolls the whole page so every lazy section and scroll animation fires.
3. Measures:
   - horizontal scroll width
   - elements crossing the viewport edge
   - touch targets under 44 × 44px (touch devices)
   - text under 12px
   - clipped text
   - overlapping text in every section
   - broken or oversized images
   - whether the floating buttons stay on screen
4. **Save the date:** presses "Reveal the date" and waits for "See you in Udaipur!".
5. **Travel FAQ:** opens the first question and checks `aria-expanded`.
6. **Gallery:** opens the first photo, checks the photo, caption, close/prev/next buttons all fit on screen without overlapping, presses Next (checks "2 / 6"), then closes it with Escape.
7. **RSVP:**
   - submits the empty form and expects 3 error messages
   - fills in name and phone, chooses "Joyfully accept", adds a guest and selects all celebrations
   - checks that no control spills outside the form
   - submits and waits for the thank-you screen
8. Records console errors, page errors and failed network requests.
9. Takes screenshots: the intro, the hero, the full page, each of the 10 sections, the lightbox, the RSVP form (errors, filled in, success) and the footer.

**Not applicable:** the site has **no navigation bar or hamburger menu**, by design. It is a single scrolling invitation that opens from an animated door intro. The parts that do the navigating were tested instead: the "Our story" scroll cue, the floating back-to-top / WhatsApp / music buttons, and the lightbox.

## Issues found and fixes

### 1. Lightbox buttons covered the photo caption (320px and 768px)
On phones and tablets the previous/next buttons sit under the photo. Their space wasn't reserved, so they landed on top of the caption ("…ivory sherwani at golden hour").
**Fix:** [`src/components/Lightbox.css`](src/components/Lightbox.css): below 1024px the photo's maximum height now leaves room for a wrapped caption and the buttons.

### 2. Couple's names cut off at the fold on laptops and landscape tablets (1366 × 768, 1024 × 768)
The names were stacked on three lines (Alica / & / Rushil) at 112px. On a 768px-tall screen "Rushil" was sliced in half, and the parents and the date were below the fold. 1366 × 768 is the most common laptop screen.
**Fix:** [`src/sections/Hero.css`](src/sections/Hero.css): on wide, short screens (at least 1024px wide and at most 900px tall) the names are set on one line ("Alica & Rushil"), with a slightly tighter arch and monogram. The names, the parents and the date now all fit in the first screen. Phones and tall desktops keep the original stacked design. The audit now checks this automatically.

### 3. Text under 12px (every device)
"Daughter of" / "Son of", the countdown labels (Days/Hours/Mins/Secs) and the "Dress code" labels were 11px.
**Fix:** raised to 12px in [`Hero.css`](src/sections/Hero.css), [`Countdown.css`](src/sections/Countdown.css) and [`Events.css`](src/sections/Events.css). The countdown labels use tighter letter-spacing below 390px so "HOURS" still fits its tile.

### 4. Story timeline text cramped on narrow phones (320–419px)
A 112px photo column left about 136px for the story text, so lines were 3–4 words long.
**Fix:** [`src/sections/Story.css`](src/sections/Story.css): below 420px the photo is 84px and the gap is smaller, which gives the text about 40px more width. The gold timeline thread is re-centred on the photo.

### 5. Floating buttons covered body text on phones (320–390px)
Three stacked round buttons (back to top, WhatsApp, music) take up 148px on the right edge and sat over story, event and travel text.
**Fix:** [`src/components/FloatingControls.jsx`](src/components/FloatingControls.jsx): on screens narrower than 768px, "back to top" now appears only while the guest is scrolling up, a common mobile pattern. When reading or scrolling down, only WhatsApp and music show, so the stack is a third smaller. Tablet and desktop behaviour is unchanged. All buttons stay 44px or larger.

### 6. Calendar button label wrapped awkwardly (320px)
"Apple / Outlook (.ics)" broke onto two left-aligned lines inside a pill button.
**Fix:** [`src/styles/base.css`](src/styles/base.css): button text is centred, and below 420px paired buttons stack full-width with slightly tighter letter-spacing, so each label fits on one line.

### 7. "By rail" travel card sat lower than its neighbours (desktop and laptop)
The shorter card was stretched to match the row height, and the grid spread the extra space between its rows, pushing the icon and title down about 10px.
**Fix:** [`src/sections/Travel.css`](src/sections/Travel.css): `align-content: start`.

### Investigated but not a bug
- **RSVP chips looked unselected with red borders** in one screenshot at 320px. A focused probe showed the checkboxes were correctly checked. The screenshot caught the 200ms colour transition from the earlier error state. The audit now waits for transitions before that screenshot.
- **Hero taller than the screen on phones and portrait tablets:** intentional. The invitation scrolls, and there is an animated "Our story" cue. On phones the names start in the first screen.

## Device-by-device results (after fixes)

| Check | 320 | 375 | 390 | 430 | 768 | 1024 L | 1366 | 1920 |
|---|---|---|---|---|---|---|---|---|
| No horizontal scroll | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nothing crosses the viewport edge | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Intro fits the first screen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hero names and date above the fold (landscape) | n/a | n/a | n/a | n/a | n/a | ✅ | ✅ | ✅ |
| Touch targets ≥ 44 × 44 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | n/a | n/a |
| No text under 12px | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| No overlapping or clipped text | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Images load and are sized right (no >2.6× oversized downloads) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Floating buttons on screen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Scratch card reveal | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| FAQ accordion | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gallery lightbox (open / next / Escape, no overlaps) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| RSVP validation → stepper → select all → submit → success | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| No console, page or network errors | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Animations and transitions:** the door opening, the hero entrance, scroll reveals, the scratch-card fade, the lightbox fade, the RSVP check-mark draw and the petal canvas all ran at every size with no layout shift. `prefers-reduced-motion` handling already existed and was left unchanged.

**Images:** gallery and story photos are served as AVIF, then WebP, then JPEG, at 480/960/1440px widths with correct `sizes` attributes. No device downloaded an image more than 2.6× larger than it was displayed.

## Screenshots

The audit screenshots were reviewed and then deleted to keep the project small. To regenerate them, run `npm run build`, then `npm run preview`, then `npm run audit:responsive -- <label>`. They are written to `screenshots/responsive/<label>/<device>/` (git-ignored), with raw measurements in `results.json`.

Each device folder contains `01-intro`, `02-hero`, `03-full-page`, `04-lightbox`, `05-rsvp-errors`, `06-rsvp-filled`, `07-rsvp-success`, `08-footer`, and `section-<id>` for every section.

Key before/after pairs that were compared (paths as written by the audit):

| Fix | Before | After |
|---|---|---|
| Laptop hero | `before/laptop-1366x768/02-hero.png` | `after/laptop-1366x768/02-hero.png` |
| Tablet landscape hero | `before/tablet-landscape-1024x768/02-hero.png` | `after/tablet-landscape-1024x768/02-hero.png` |
| Lightbox, small phone | `before/small-mobile-320x568/04-lightbox.png` | `after/small-mobile-320x568/04-lightbox.png` |
| Lightbox, tablet | `before/tablet-portrait-768x1024/04-lightbox.png` | `after/tablet-portrait-768x1024/04-lightbox.png` |
| Story, small phone | `before/small-mobile-320x568/section-story.png` | `after/small-mobile-320x568/section-story.png` |
| Countdown, small phone | `before/small-mobile-320x568/section-countdown.png` | `after/small-mobile-320x568/section-countdown.png` |
| Travel cards, laptop | `before/laptop-1366x768/section-travel.png` | `after/laptop-1366x768/section-travel.png` |

## Remaining issues and limits

- **Testing ran in Chromium only.** Safari on iOS (WebKit) and Firefox were not tested. Safari is the most important gap for a wedding invite shared over WhatsApp. The CSS uses `svh` units and `text-wrap: balance`, both supported in Safari 16+. A quick check on a real iPhone is recommended.
- **Device emulation is not a real device.** Touch, viewport and DPR were emulated. Real-device effects such as the iOS address bar resizing the viewport or the notch were not tested beyond the existing `env(safe-area-inset-*)` handling.
- **Phone landscape** (for example 844 × 390) was outside the requested matrix and was not audited.
- On phones, the two remaining floating buttons can still briefly cover the right edge of text while scrolling. This is a deliberate trade-off to keep share and music one tap away.
