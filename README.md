# Alica & Rushil · Digital Wedding Invitation

A single-page, mobile-first wedding invitation built with React + Vite and plain CSS.
Palace doors with a wax seal open onto the invitation, followed by the couple's story, a
scratch-to-reveal date, a live countdown, the venue, events with dress codes, a gallery,
travel information, an RSVP form and a closing blessing.

Everything about the couple lives in one file, [`src/config.js`](src/config.js), so the site can be
reused for another wedding by editing that file and swapping photos and music.

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # production build in dist/
npm run preview        # serve dist/ on http://localhost:4173
```

Node 18+ is required (developed on Node 24).

### Personalised links

Add `?guest=Name` to the URL to greet a guest by name on the intro and hero and pre-fill their
RSVP, e.g. `https://your-site.vercel.app/?guest=Priya%20Sharma`.

---

## Editing the content (`src/config.js`)

| Export        | What it controls                                                             |
| ------------- | ---------------------------------------------------------------------------- |
| `couple`      | Names, parents, monogram letters, hashtag                                    |
| `invitation`  | Invitation wording and the personalised greeting (`{guest}` placeholder)     |
| `dates`       | Countdown start/end (ISO with `+05:30`), the scratch-card text, RSVP deadline |
| `venue`       | Venue name, address, Google Maps link                                        |
| `story`       | Timeline milestones (year, title, text, photo name)                          |
| `events`      | Each ceremony: time, place, description, dress code and colour chips         |
| `days`        | Day headings that group the events                                           |
| `photos`      | Photo names, alt text and aspect ratios (see below)                          |
| `travel`      | How to reach, shuttle note, hotels, FAQ                                      |
| `rsvp`        | Endpoint (from env), deadline, maximum party size                            |
| `blessings`   | Closing quote, message and signature                                         |
| `music`       | Music file path and volume                                                   |
| `share`       | WhatsApp share message                                                       |
| `credit`      | Footer credit text and link                                                  |
| `seo`         | Page title, description and share image (injected into `index.html`)        |

Event `icon` values: `paisley`, `marigold`, `dhol`, `diya`, `sparkle`.
Travel `icon` values: `plane`, `train`, `car`.

The page title, description, Open Graph and Twitter tags are generated from `seo` at build time,
so link previews always match the content.

---

## Photos

1. Put your photos in `photos-src/` using the names listed in `config.js → photos`
   (`story-1.jpg … story-3.jpg`, `gallery-1.jpg … gallery-6.jpg`). JPG, PNG, WebP, AVIF or HEIC all work.
2. If a photo's shape differs, update its `width`/`height` in `config.js`. Only the ratio matters;
   images are cropped to it with smart (attention-based) cropping.
3. Run:

   ```bash
   npm run images
   ```

This writes AVIF, WebP and JPEG versions at 480/960/1440 px into `public/photos/`. Commit those
files, so deployment needs no image tooling.

To add or remove gallery photos, edit the `photos.gallery` array, then rerun `npm run images`.
`npm run placeholders` regenerates the illustrated placeholders.

## Music

Replace `public/music/wedding-theme.mp3` with any MP3 (keep it under ~1 MB; 64–96 kbps mono is
plenty), or point `music.src` at a new file. The file only downloads after the guest taps the
seal, so it never slows the first load. It fades in and out, and pauses while the guest is in
another app. `npm run music` regenerates the bundled placeholder track (synthesised, royalty-free).

## Share image

`public/og-image.jpg` (1200×630) is the WhatsApp/social preview. After changing names or dates,
regenerate it together with the Apple touch icon:

```bash
npm run og
```

---

## Connecting the RSVP form

Copy `.env.example` to `.env` (or set the variables in your hosting dashboard):

```bash
VITE_SITE_URL=https://your-site.vercel.app
VITE_RSVP_ENDPOINT=...
```

With no endpoint the form runs in **demo mode**: it validates, shows the loading state and
success animation, but sends nothing.

### Option A: Formspree (simplest)

1. Create a form at [formspree.io](https://formspree.io) and copy its URL (`https://formspree.io/f/xxxxxxx`).
2. Set `VITE_RSVP_ENDPOINT` to that URL and rebuild/redeploy.

Submissions arrive by email and in the Formspree dashboard as JSON fields:
`name, phone, attending, guests, events, message, submittedAt`.

### Option B: Google Sheets via Apps Script

1. Create a Google Sheet → **Extensions → Apps Script**, and paste:

   ```js
   function doPost(e) {
     const book = SpreadsheetApp.getActiveSpreadsheet();
     const sheet = book.getSheetByName('RSVPs') || book.insertSheet('RSVPs');
     if (sheet.getLastRow() === 0) {
       sheet.appendRow(['Submitted', 'Name', 'Phone', 'Attending', 'Guests', 'Events', 'Message']);
     }
     const p = e.parameter;
     sheet.appendRow([p.submittedAt, p.name, p.phone, p.attending, p.guests, p.events, p.message]);
     return ContentService.createTextOutput('ok');
   }
   ```

2. **Deploy → New deployment → Web app**, execute as *Me*, access *Anyone*.
3. Set `VITE_RSVP_ENDPOINT` to the `https://script.google.com/macros/s/…/exec` URL.

Apps Script doesn't send CORS headers, so the site posts in `no-cors` mode and treats a
completed request as success.

---

## Deploying

The project is a standard Vite app, and both hosts detect it with zero configuration.

- **Vercel:** import the repository, keep the defaults (build `npm run build`, output `dist`),
  and add the two environment variables.
- **Netlify:** new site from Git, build command `npm run build`, publish directory `dist`,
  and add the environment variables under *Site settings → Environment*.

Set `VITE_SITE_URL` to the final domain so the share image URL in the meta tags is absolute,
which WhatsApp requires.

---

## Testing

```bash
npx playwright install chromium   # first time only
npm test                          # builds, serves and runs every spec at 5 viewports
npm run lighthouse                # mobile Lighthouse against `npm run preview`
```

The Playwright suite (`tests/`) runs every spec at 360, 390, 768, 1024 and 1440 px:

- every section renders; no console errors; no horizontal overflow at any scroll position
- no overlapping text in any section (measured from glyph bounding boxes)
- axe-core (WCAG 2.1 A/AA) on the intro and on the opened invitation
- the seal opens the invite and starts music; the toggle mutes and unmutes
- `?guest=` personalisation; scratch-to-reveal and the fallback button
- countdown values and per-second ticking (with a fake clock)
- Maps, Google Calendar, `.ics` download (5 events) and WhatsApp links
- lightbox open / next / previous / arrow keys / Escape / focus return
- FAQ expand and collapse; RSVP validation, loading, success and persistence

Full-page screenshots for each viewport are written to `screenshots/`. `npm run lighthouse` writes
`lighthouse/report.html`.

---

## Project structure

```
src/
  config.js              all content: the only file to edit per couple
  App.jsx                page shell; sections mount progressively behind the intro
  sections/              one component (+ CSS) per section, Gallery code-split
  components/            Monogram, ScratchCard, Lightbox (lazy), Picture, motifs, icons…
  hooks/                 useInView, useCountdown, useMusic, useGuestName
  lib/                   calendar (.ics / Google), RSVP submit, petal particle engine, motion
  styles/                design tokens (colours, type & 8px spacing scales) and base styles
public/                  fonts (subset woff2), photos, music, share image, favicon
photos-src/              original photos; run `npm run images` after changing them
scripts/                 image pipeline, OG image, music synthesis, Lighthouse runner
tests/                   Playwright specs
```

## Design notes

- **Palette:** palace emerald, ivory parchment and antique gold, defined as CSS variables in
  `src/styles/tokens.css`.
- **Type:** Pinyon Script (names, headings), Cormorant Garamond (body), Cinzel (letter-spaced
  labels). Self-hosted and subset to Latin (~70 KB total), with `font-display: swap`.
- **Motifs:** jharokha arches, a marigold toran, mandalas, a lotus divider and a line-art lake
  palace, all drawn as SVG.
- **Motion:** composited transform/opacity animations, scroll reveals via a shared
  IntersectionObserver, and a canvas petal engine capped at 120 particles. All of it is
  disabled under `prefers-reduced-motion`.
- **Performance:** the intro paints first; sections mount one per idle slot, laid out invisibly
  behind the doors, so opening them costs no layout. Off-screen sections use
  `content-visibility: auto`, and the gallery and lightbox are separate chunks.
