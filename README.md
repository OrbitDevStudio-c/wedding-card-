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
- **English and ગુજરાતી:** a language switch on every page translates the whole experience, remembers the choice, and loads Gujarati only for guests who choose it. See [English ⇄ ગુજરાતી](#english--ગુજરાતી).
- **Royal heritage design:** peacocks, caparisoned elephants, jharokha corners, jaali lattices and peacock-feather dividers, drawn as light SVG. See [Royal heritage design](#royal-heritage-design).
- **Responsive and accessible:** tested from 320 px phones to 1920 px desktops, WCAG 2.1 AA checked with axe-core, and reduced-motion support.
- **Wedding Gifts & Our Dreams:** a private gift registry where each gift can be reserved by exactly one guest (enforced by the database), contributions towards bigger dreams with verified Razorpay payments, a secure couple dashboard and QR codes. See [Wedding Gifts & Our Dreams](#wedding-gifts--our-dreams).
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
| 10 | **Wedding Gifts** | An emerald band with two arch cards, **Our Wishlist** and **Our Dreams**, and a **View our wishlist** button that opens the dedicated gift page at `/gifts` (keeping `?guest=`). Hidden when gifts are disabled. |
| 11 | **RSVP: "Will You Join Us?"** | Name and phone (validated), **Joyfully accept / Regretfully decline** cards, a **guest stepper** (1–6), celebration chips with **Select all**, and an optional note with a character counter. Clear inline errors, a sending spinner, then a **thank-you screen** with an animated check mark and petals. The response is remembered on the device, with **Edit my response**. |
| 12 | **Blessings: Thank You** | An arch card over a mandala with a quote, a thank-you message, the couple's signature and their wedding hashtag. |
| 13 | **Footer** | The monogram and the "Crafted with ❤️ in India by OrbitDevStudio" credit. |

**Always available**, floating at the bottom right once the doors open:
- **Music** on/off, with a small dancing equaliser while it plays
- **Share on WhatsApp**
- **Back to top** (on phones it appears when the guest scrolls up)

**Ambient touches:** soft marigold and rose petals drift down the page. On desktop, the cursor leaves a trail of petals. All motion switches off for guests who prefer reduced motion.

---

## Wedding Gifts & Our Dreams

A gift registry for two, built as another chapter of the invitation rather than a separate app.

| Route | Who | What |
|---|---|---|
| `/#gifts` | Guests | The **Wedding Gifts** section in the invitation, linking to the gift page |
| `/gifts` | Guests | Hero with the couple's photo, **Our Wishlist** (category filters, reserve a gift) and **Our Dreams** |
| `/gifts/dream/<slug>` | Guests | One dream: cover, progress and the contribution form. Every dream has its own QR code |
| `/couple/login` | Couple | Sign in |
| `/couple/dashboard` | Couple | Overview, Wishlist, Reservations, Dreams, Contributions, Share & QR |

`?guest=Name` is carried from the invitation to the gift pages, greets the guest and pre-fills their name.

### Two separate systems

**Physical wishlist.** Guests reserve a gift, then buy it anywhere they like. The site never sells or processes gift purchases.

- Only one guest can reserve a gift. A **partial unique index** (`UNIQUE (gift_id) WHERE active`) on
  `gift_reservations` makes the database reject a second active reservation, so even simultaneous requests
  produce exactly one success; the others get a friendly "Another guest has just chosen this gift".
- Reserved gifts are filtered out of the public list **in SQL**. Public responses contain only
  `id, name, description, image, estimatedPrice, purchaseUrl, category`: never a guest's name, phone,
  message, or even a "reserved" flag.
- Reservations never expire. They stay active until the couple **releases** them (with confirmation),
  which puts the gift back on the wishlist and keeps the old reservation as history. The couple can also
  **mark a gift received**.

**Our Dreams.** Guests contribute money towards larger goals (a honeymoon, a home).

- Amounts only count once the **server** has verified them: either Razorpay's checkout signature
  (`HMAC-SHA256(order_id|payment_id, key_secret)`) or a signed webhook. A browser saying "paid" is never enough.
- Webhook event ids are stored once, and marking a payment paid only succeeds if it is not paid already,
  so duplicate deliveries never double-count. A webhook whose amount differs from the order is ignored.
- The couple can record gifts received offline (cash, bank transfer) per dream; progress shows verified
  online payments plus that amount.
- Reservations and contributions live in different tables and code paths and never affect each other.

### Architecture

```
Browser ── /api/* (same origin) ──► Express API (server/) ──► PostgreSQL (Neon)
   │                                     │
   └ Vite SPA: invitation, /gifts,       ├ public:  wishlist, reserve, dreams, contribute, verify
     /couple/* (code-split chunks)       ├ couple:  session + CSRF + wedding ownership on every route
                                         └ webhook: raw-body HMAC, idempotent
```

The browser always calls **same-origin `/api`**. Locally Vite proxies it to the API (`API_PROXY_TARGET`,
default `http://127.0.0.1:4000`); in production your host rewrites `/api/*` to the API server. Keeping it
same-origin lets the couple's session cookie be `HttpOnly; SameSite=Strict`.

The gifts page and the dashboard are separate lazy chunks, so the invitation does not grow. Guests who never
open the gift page never download it, and guests never download dashboard code.

**Tables** (created automatically on start, in the Postgres schema `DB_SCHEMA`, default `wedding_gifts`):
`weddings`, `couple_users`, `gifts`, `gift_reservations`, `dreams`, `dream_contributions`, `webhook_events`.
All ids are UUIDs, and every couple query is scoped by the signed-in user's `wedding_id`.

### Security

| Concern | How it is handled |
|---|---|
| Authentication | bcrypt (cost 12) password hashes; JWT (HS256) in an `HttpOnly`, `SameSite=Strict` cookie (`Secure` in production). The user is re-loaded on every request, and `token_version` lets a password reset sign out old sessions |
| Authorisation | Every `/api/couple/*` route is scoped to the session's wedding. Another couple's ids return 404 |
| CSRF | Double-submit token: the readable `wg_csrf` cookie must be echoed in `X-CSRF-Token` on every write |
| Injection | Parameterised SQL only; request bodies containing `$` operators or dotted keys are rejected; every field is type-checked |
| Validation | Server-side for every field: lengths, phone format, whole rupees, `http(s)` links only, own or `https` images |
| Abuse | Per-IP rate limits on reservations, contributions and login; a hidden honeypot field on guest forms |
| Uploads | JPEG/PNG/WebP/AVIF up to 6 MB, decoded and **re-encoded to WebP by sharp** (drops metadata and anything that is not an image), random file names |
| Headers | `helmet` defaults; `no-store` on availability and private responses; CORS only for origins in `CORS_ORIGINS` |
| Privacy | No guest details in public APIs, HTML, config, bundles or analytics; the dashboard is `noindex` |
| Secrets | Environment variables only. Nothing secret is in `src/` or the built bundle |

### Running it locally

```bash
npm install
npm run server:install                 # installs server/ dependencies
# .env (project root) must contain NEON_DB=postgresql://... (or set DATABASE_URL)
COUPLE_EMAIL=you@example.com COUPLE_PASSWORD='a long passphrase' npm run seed
npm run server                         # API on http://localhost:4000 (tables are created on start)
npm run dev                            # site on http://localhost:5173, with /api proxied to the API
```

`npm run seed` creates the wedding `alica-rushil` with the sample wishlist and three dreams, plus the couple
login. It leaves existing gifts and dreams alone unless you add `-- --reset`, which also deletes that
wedding's reservations and contributions (never use it on a live wedding).

Couple accounts (any number, each tied to one wedding):

```bash
cd server
COUPLE_PASSWORD='at least 12 characters' npm run create-couple -- --wedding alica-rushil --email partner@example.com
```

Running it again for the same email resets the password and signs out existing sessions.

### Configuration

Presentation lives in `src/config.js → gifts`: wording for the hero, wishlist, reservation privacy notice and
success message, dreams intro, the category list and the contribution presets (₹1,100 / 2,100 / 5,100 / 11,000).
Gifts, dreams and reservations themselves live only in the database and are managed from the dashboard.

| Frontend variable | Default | Purpose |
|---|---|---|
| `VITE_WEDDING_SLUG` | `alica-rushil` | Which wedding the gift pages load |
| `VITE_GIFTS_ENABLED` | `true` | `false` removes the invitation section and the `/gifts` routes |
| `VITE_SITE_URL` | | Also the domain encoded in every QR code |

The server can also switch gifts or dreams off per wedding (`weddings.gifts_enabled`, `dreams_enabled`).
The public endpoints then return 404, and the gift page shows a gentle "not open" message.

Server variables are documented in [`server/.env.example`](server/.env.example). The important ones are
`DATABASE_URL` (or `NEON_DB`), `JWT_SECRET` (required in production, 32+ characters), `RAZORPAY_*`,
`UPLOAD_DIR`, `CORS_ORIGINS` and `TRUST_PROXY`.

### Payments (Razorpay)

Without `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, dreams run in **demo mode**. The page says so clearly,
guests can leave a pledge that the couple sees as "Demo pledge", and **no money moves and totals do not change**.

To take real contributions:

1. Create a Razorpay account and complete KYC. Generate **API keys** (Dashboard → Account & Settings → API Keys).
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on the API server.
3. Add a webhook (Dashboard → Webhooks) pointing to `https://<your-site>/api/payments/razorpay/webhook`
   with the events `payment.captured`, `order.paid` and `payment.failed`, and set its secret as `RAZORPAY_WEBHOOK_SECRET`.
4. Test with `rzp_test_…` keys first, then switch to live keys.

The flow: the server creates the order (so the amount cannot be altered in the browser) → Razorpay Checkout
opens (its script loads only at that moment) → the server verifies the signature → the webhook confirms
it again, idempotently.

### QR codes

Dashboard → **Share & QR** shows a master code for `/gifts` and one per dream (also under each dream's
**QR** button), with **Download PNG** (1024 px), **Download SVG**, **Copy link** and **Regenerate**. Codes always
encode `VITE_SITE_URL`, never `localhost`, so set it to the real domain before printing. Changing a dream's
link changes its code, and the editor warns about this.

### API

Public (no login):

| Method | Path | Notes |
|---|---|---|
| GET | `/api/weddings/:slug` | Couple names, date, which features are on, payment mode |
| GET | `/api/weddings/:slug/gifts` | Active, unreserved gifts only, public fields only |
| POST | `/api/weddings/:slug/gifts/:giftId/reservations` | `{guestName, guestPhone?, message?}` → 201, or 409 `already_reserved` |
| GET | `/api/weddings/:slug/dreams` | Active dreams with totals and progress |
| GET | `/api/weddings/:slug/dreams/:dreamSlug` | One dream |
| POST | `/api/weddings/:slug/dreams/:dreamSlug/contributions` | `{contributorName, amount, message?}` → a Razorpay order, or `{mode: 'demo'}` |
| POST | `/api/weddings/:slug/contributions/verify` | `{orderId, paymentId, signature}` from Checkout |
| POST | `/api/payments/razorpay/webhook` | Razorpay only; signature-checked |
| POST | `/api/auth/login`, `/api/auth/logout` | Couple session |

Private (session cookie, plus `X-CSRF-Token` on writes; always scoped to the couple's wedding):

| Method | Path |
|---|---|
| GET | `/api/couple/me`, `/api/couple/dashboard` |
| GET, POST | `/api/couple/gifts` |
| PUT | `/api/couple/gifts/order` (`{ids: [...]}`), `/api/couple/gifts/:giftId` |
| DELETE | `/api/couple/gifts/:giftId` (409 while reserved) |
| POST | `/api/couple/uploads` (multipart field `image`) |
| GET | `/api/couple/reservations` (`?status=active`) |
| POST | `/api/couple/reservations/:id/release`, `/api/couple/reservations/:id/mark-received` |
| GET, POST | `/api/couple/dreams` |
| PUT, DELETE | `/api/couple/dreams/:dreamId` (delete is refused once verified payments exist; hide it instead) |
| GET | `/api/couple/contributions` |

Errors are JSON: `{error, message, fields?}`.

---

## English ⇄ ગુજરાતી

Every page (the invitation, the gift page and the couple dashboard) has a language switch,
`[ EN | ગુજરાતી ]`. On the invitation it floats top-right, above the palace doors, so guests can
choose before opening; on the gift page and dashboard it sits in the top bar.

- **Instant:** switching re-renders in place: no reload, and forms keep what the guest typed. Errors already
  on screen are re-worded too, because validation stores message keys, not sentences.
- **Remembered:** the choice is saved in the browser and kept across pages, refreshes and later visits.
  A link can also choose it: `https://your-site/?guest=Priya&lang=gu`.
- **Accessible:** the switch is a pair of toggle buttons (`aria-pressed`), each label carries its own
  `lang`, and `<html lang>` follows the choice, so screen readers pronounce Gujarati correctly.
- **Light:** the Gujarati pack (≈9 KB gzip) and the Gujarati font (≈33 KB per weight) load only for guests
  who choose Gujarati. Returning Gujarati guests get the pack before the first paint, so there is no flash of English.
- **Typography:** Gujarati uses self-hosted **Noto Serif Gujarati** (OFL), limited by `unicode-range` to
  Gujarati characters. Latin names, numbers and prices keep Pinyon Script, Cormorant and Cinzel. Gujarati
  labels drop the uppercase and wide letter-spacing that would break its conjuncts, and get taller line-heights.

### Where the text lives

| What | English | Gujarati |
|---|---|---|
| Interface text (buttons, labels, errors, dashboard) | `src/i18n/strings.en.js` | `src/i18n/strings.gu.js` |
| The couple's content (story, events, travel, blessings, gift-page wording) | `src/config.js` | `src/i18n/content.gu.js` |
| Gift names and descriptions, dream titles and descriptions | Dashboard | Dashboard → each gift / dream → **Gujarati version** |

`content.gu.js` mirrors the shape of `config.js` but lists only text. Arrays line up by position
(`story[0]` translates `story[0]`). **Anything missing or empty falls back to English**, so a half-translated
wedding never shows blank labels. Personal names, venue names, addresses, dates, prices, phone numbers and
links are deliberately not translated.

To add another language later: add `strings.<code>.js` and `content.<code>.js`, export them from a pack like
`src/i18n/gu.js`, register it in `LANGUAGES` and `LOADERS` in `src/i18n/index.jsx`, and add the code to
`TRANSLATION_LANGS` in `server/src/lib/validate.js`.

---

## Royal heritage design

The invitation and gift page share an Indian royal design language built on the original palette:

| Token | Colour | Used for |
|---|---|---|
| `--royal-emerald` | `#123D32` | Gift page hero, line work ink |
| `--peacock` | `#075B50` | Peacock body, feather barbs |
| `--antique-gold` | `#C5A15B` | Borders, corners, dividers, highlights (never large fills) |
| `--warm-ivory` / `--palace-cream` | `#F8F3E8` / `#EFE3CC` | Elephant bodies, QR frames |
| `--burgundy` | `#702D46` | Elephant jhool and medallions, prices, day labels |
| `--heritage-brown` | `#49352C` | Reserved for deep accents |

Artwork lives in [`src/components/Royal.jsx`](src/components/Royal.jsx) as lightweight SVG (no images):

- **Peacock**: a profile with a fanned train of eyed feathers that opens feather by feather on the gift page
  (static under reduced motion).
- **Royal elephant**: caparisoned, with a lattice jhool (ceremonial blanket) and scalloped hem, a forehead
  plate, tassels, anklets and a raised trunk. Pairs flank the hero arch on wide screens, divide the two
  days of celebrations and sit beneath the blessings.
- **Peacock-feather divider**: two feathers around a lotus, under every section title.
- **Jharokha corners** on wishlist cards and QR frames, **chhatri** skylines in the footer and on the
  dashboard login, and a faint carved-stone **jaali** lattice behind parchment sections, the gift hero and the
  reservation modal.

All of it is decorative (`aria-hidden`) and outside the text flow, so the overlap and accessibility tests
are unaffected.

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

The site's runtime dependencies are `react`, `react-dom` and `qrcode` (loaded only inside the couple dashboard).
The gifts API in [`server/`](server/) is a separate Node package: Express 5, `pg` (PostgreSQL / Neon), `bcryptjs`,
`jsonwebtoken`, `helmet`, `express-rate-limit`, `cookie-parser`, `multer` and `sharp`.

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
| `gifts`       | Gift page wording, categories, contribution presets, on/off (see Wedding Gifts) |

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
which WhatsApp requires. It is also the domain inside every QR code.

### Deploying the gifts API

The site stays static; the API is a long-running Node service. Any Node host works (Render, Railway,
Fly.io, a VPS). On the API host:

1. Use `server/` as the root directory, build with `npm ci`, start with `npm start` (Node 18.18+).
2. Set `NODE_ENV=production`, `DATABASE_URL` (the Neon pooled connection string) and `JWT_SECRET`, plus the
   `RAZORPAY_*` variables when you are ready to take payments.
3. Give `UPLOAD_DIR` a **persistent disk or volume**, or uploaded images will vanish on redeploy.
4. Create the couple login once with `npm run seed` and `COUPLE_EMAIL`/`COUPLE_PASSWORD`, from the host's
   shell or locally against the production `DATABASE_URL`.

Then point the site's `/api` at it, so the browser sees one origin:

- **Vercel:** add this rule **above** the existing one in `vercel.json`:
  `{ "source": "/api/:path*", "destination": "https://YOUR-API-HOST/api/:path*" }`
- **Netlify:** add `/api/*  https://YOUR-API-HOST/api/:splat  200` as the **first** line of `public/_redirects`.

`vercel.json` and `public/_redirects` already send `/gifts` and `/couple/*` to the app. Set
`TRUST_PROXY` to the number of proxies in front of the API so rate limits see real client IPs.

---

## Testing

```bash
npx playwright install chromium   # first time only
npm test                          # builds, serves and runs every spec at 5 viewports
npm run lighthouse                # mobile Lighthouse against `npm run preview`
```

The invitation specs (`tests/*.spec.js`) run at 360, 390, 768, 1024 and 1440 px:

- every section renders; no console errors; no horizontal overflow at any scroll position
- no overlapping text in any section (measured from glyph bounding boxes)
- axe-core (WCAG 2.1 A/AA) on the intro and on the opened invitation
- the seal opens the invite and starts music; the toggle mutes and unmutes
- `?guest=` personalisation; scratch-to-reveal and the fallback button
- countdown values and per-second ticking (with a fake clock)
- Maps, Google Calendar, `.ics` download (5 events) and WhatsApp links
- lightbox open / next / previous / arrow keys / Escape / focus return
- FAQ expand and collapse; RSVP validation, loading, success and persistence

**Gifts** (`tests/gifts/`). Playwright starts the API on port 4010 against a throwaway Postgres schema
(`gifts_test`, reset before each run, using `NEON_DB`/`DATABASE_URL` from `.env`), a local fake of the Razorpay
orders API, and test-only secrets. Nothing touches your real `wedding_gifts` data or real payments.

- `api.spec.js` (runs once): public lists hide reserved and hidden gifts and carry no private fields;
  validation; duplicate and **15 simultaneous** reservations give exactly one success; the unique index exists
  and nothing expires; release and mark-received; 401 without a session, forged cookies, missing CSRF,
  operator injection; **another wedding's couple cannot read or change these reservations**; add, edit,
  reorder, hide and delete; unsafe links rejected; image re-encoding; forged payments and forged webhooks
  change nothing; verified checkouts and webhooks count once; duplicate webhooks ignored; amount mismatches ignored
- `ui.spec.js` (at 8 sizes, 320 to 1920 px): invitation → gift page with `?guest=`; filters and store links;
  the full reservation dialog (validation, privacy notice, success, the gift disappears, Escape returns focus);
  "Just missed it"; a dream page with a simulated, signature-verified payment and a forged one; the demo-mode label;
  login, a private reservation with its message, release with confirmation; adding and editing a gift; QR codes
  encode the deployed domain; no horizontal overflow and axe-core (WCAG 2.1 AA) on every gift and dashboard page

**Languages** (`tests/i18n.spec.js`): English by default; switching both ways without a reload; keyboard
and `aria-pressed`; persistence after refresh and across pages; every section translated; English fallback
for untranslated content and gifts; RSVP and gift-reservation validation in both languages, with typed answers
and the `?guest=` greeting surviving a switch; and Gujarati at 320 px with no overflow, no overlapping text, the
Gujarati font loaded and no axe violations.

```bash
npm run test:gifts                    # only the gifts tests
npx playwright test tests/i18n.spec.js
```

The gifts tests are slower than the rest because every request goes to the remote database.

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
  lib/                   calendar (.ics / Google), RSVP submit, petal particle engine, motion, API client, router
  styles/                design tokens (colours, type & 8px spacing scales) and base styles
public/                  fonts (subset woff2), photos, music, share image, favicon
photos-src/              original photos; run `npm run images` after changing them
  gifts/                 /gifts and /gifts/dream/:slug (lazy chunk): hero, wishlist, reserve dialog, dreams
  couple/                /couple/* dashboard (lazy chunk): login, overview, wishlist, reservations, dreams, QR
  i18n/                  language context, switcher, English/Gujarati strings, Gujarati content overlay
server/                  gifts API: Express + PostgreSQL (see "Wedding Gifts & Our Dreams")
  src/db.js              connection pool and schema (tables, the unique active-reservation index)
  src/routes/            public.js, couple.js, auth.js, payments.js (webhook)
  scripts/               seed.js (sample wedding + couple login), create-couple.js
scripts/                 image pipeline, OG image, music synthesis, gift artwork, Lighthouse runner, responsive audit
tests/                   Playwright specs; tests/gifts/ holds the gifts API and page tests
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
