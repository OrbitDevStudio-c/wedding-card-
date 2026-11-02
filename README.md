# Alica & Rushil · Digital Wedding Invitation

A single-page, mobile-first wedding invitation built with React + Vite and plain CSS.
Palace doors with a wax seal open onto the invitation, followed by the couple's story, a
scratch-to-reveal date, a live countdown, the venue, events with dress codes, a gallery,
travel information, an RSVP form and a closing blessing.

Everything about the couple lives in one file, [`src/config.js`](src/config.js), so the site can be
reused for another wedding by editing that file and swapping photos and music.

Crafted by [OrbitDevStudio](https://orbit-dev-studio.vercel.app/).

---

## Highlights

- **Cinematic opening:** guests tap a gold wax seal, and two carved palace doors swing open in 3D to reveal the invitation.
- **Scratch-to-reveal date:** a gold-foil scratch card the guest rubs away with a finger or mouse to discover the wedding dates, with a burst of falling petals.
- **Live countdown** to the first ceremony, ticking every second, with one-tap **Add to Google Calendar** and an **Apple / Outlook `.ics`** file holding every event.
- **Personalised invites:** send each guest their own link (`?guest=Priya`), and the site greets them by name and pre-fills their RSVP.
- **Complete RSVP flow:** attendance, party size, which celebrations, and a note to the couple. It validates, then sends to Formspree or Google Sheets.
- **Indian royal design language:** jharokha arches, a marigold toran, mandalas, a lotus divider and a line-art lake palace, in emerald, ivory and antique gold.
- **Background music** that fades in when the doors open and pauses when the guest switches apps.
- **WhatsApp sharing** with a rich link preview (title, date and image).
- **Responsive and accessible:** tested from 320 px phones to 1920 px desktops, WCAG 2.1 AA checked with axe-core, and reduced-motion support.
- **Fast:** under 70 KB of JavaScript (gzip), AVIF/WebP photos, self-hosted fonts, and lazy-loaded gallery and music.

---

## Sections, from top to bottom

| # | Section | What the guest sees and can do |
|---|---|---|
| 1 | **Intro: palace doors** | Two emerald doors with gold rosettes and studded panels, sealed by a gold wax seal stamped with the couple's monogram. "Tap the seal to open": the seal cracks, the doors swing open in 3D and the music begins. Shows "Dear {guest}," on personalised links. |
| 2 | **Hero invitation** | The couple's names in calligraphy inside a tall jharokha arch, under a hanging marigold toran, with a slowly turning mandala behind (soft parallax on scroll). Monogram with a gold shimmer, "Together with their families", both sets of parents, the dates and the city. A gentle "Our story" scroll cue. |
| 3 | **Our Story** | A vertical timeline (How we met → The proposal → Forever) with arch-framed photos. A gold thread draws itself down the timeline as it scrolls into view; on desktop the chapters alternate left and right. |
| 4 | **Save the Date: scratch card** | An arch-shaped card covered in textured gold foil. The guest scratches it away by touch or mouse; once about 45% is cleared, the dates appear with a petal burst. A "Reveal the date" button is provided for keyboard and screen-reader users. |
| 5 | **Countdown** | Days / hours / minutes / seconds in arch tiles, with a rolling animation on each tick, counting down to the first ceremony in IST, correct in any time zone. "Add to your calendar" buttons for Google Calendar and `.ics` (all five ceremonies). |
| 6 | **The Venue** | A line-art illustration of a lakeside palace (domes, arches, boat, birds, sun) that draws itself stroke by stroke, next to the venue name, address, dates and a **View location** button that opens Google Maps. |
| 7 | **The Celebrations** | Events grouped by day (Mehendi, Haldi, Sangeet, Wedding Pheras, Reception). Each arch-topped card shows an icon, time, place, a short description and a **dress code with colour swatches**, so guests know what to wear. |
| 8 | **Moments: gallery** | A masonry photo grid; every third frame has an arch crown. Tapping a photo opens a full-screen **lightbox** with caption, "2 / 6" counter, next/previous buttons, **swipe on phones**, arrow keys and Escape. |
| 9 | **Travel & Stay** | Cards for arriving **by air, rail and road**, a shuttle note, **partner hotels** with distance and a map pin for each, and a **"Good to know" FAQ** accordion (accommodation, weather, children, plus-ones, gifts). |
| 10 | **RSVP: "Will You Join Us?"** | Name and phone (validated), **Joyfully accept / Regretfully decline** cards, a **guest stepper** (1–6), celebration chips with **Select all**, and an optional note with a character counter. Clear inline errors, a sending spinner, then a **thank-you screen** with an animated check mark and petals. The response is remembered on the device, with **Edit my response**. |
| 11 | **Blessings: Thank You** | An arch card over a mandala with a quote, a thank-you message, the couple's signature and their wedding hashtag. |
| 12 | **Footer** | The monogram and the "Crafted with ❤️ in India by OrbitDevStudio" credit. |

**Always available**, floating at the bottom right once the doors open:
- **Music** on/off, with a small dancing equaliser while it plays
- **Share on WhatsApp**
- **Back to top** (on phones it appears when the guest scrolls up)

**Ambient touches:** soft marigold and rose petals drift down the page. On desktop, the cursor leaves a trail of petals. All motion switches off for guests who prefer reduced motion.

---

## Built with

| Area | Technology |
|---|---|
| UI | [React 18](https://react.dev) with function components and hooks |
| Build tool | [Vite 5](https://vitejs.dev) |
| Styling | Plain CSS with design tokens (CSS custom properties), no CSS framework |
| Fonts | Pinyon Script, Cormorant Garamond and Cinzel, self-hosted and subset (`woff2`) |
| Graphics | Inline SVG (monogram, palace, icons, motifs) and HTML Canvas (scratch card, petals) |
| Images | [sharp](https://sharp.pixelplumbing.com) pipeline producing AVIF / WebP / JPEG at three widths |
| Audio | HTML audio with a Web Audio gain node for smooth fades (iOS-safe) |
| Forms | Formspree or Google Apps Script (Google Sheets); demo mode with neither |
| Testing | [Playwright](https://playwright.dev), [axe-core](https://github.com/dequelabs/axe-core) for accessibility, Lighthouse for performance |
| Hosting | Any static host: Vercel, Netlify and others |

Runtime dependencies are only `react` and `react-dom`. Everything else is a build-time or test-time tool.

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
`lighthouse/report.html`. Both folders are git-ignored.

### Responsive audit

With `npm run preview` running, `npm run audit:responsive -- <label>` drives the site at eight
device sizes (320×568 up to 1920×1080). At each size it:
- opens the seal and scrolls the whole page
- checks for overflow, touch targets under 44 px, text under 12 px, overlapping text and image sizing
- uses the scratch card, FAQ, lightbox and the full RSVP flow
- saves screenshots to `screenshots/responsive/<label>/`

See [`RESPONSIVE-AUDIT.md`](RESPONSIVE-AUDIT.md) for the latest results.

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
scripts/                 image pipeline, OG image, music synthesis, Lighthouse runner, responsive audit
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
