import { gifts } from '../config.js';
import { Mandala } from '../components/Motifs.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { linkHandler, withGuest } from '../lib/router.js';
import './GiftsTeaser.css';

// The invitation's doorway to the gifts page. It links rather than embeds, so none of the
// wishlist code or data loads until a guest chooses to look.
export function GiftsTeaser({ guest }) {
  const href = withGuest('/gifts', guest);
  const { teaser } = gifts;
  return (
    <section
      className="section tone-dark has-scallop has-scallop-bottom gifts-teaser"
      id="gifts"
      aria-labelledby="gifts-title"
      style={{ '--scallop-from': 'var(--ivory-50)', '--scallop-to': 'var(--ivory-100)' }}
    >
      <Mandala className="gifts-teaser__mandala" />
      <div className="container container--narrow gifts-teaser__inner">
        <SectionHeading id="gifts-title" eyebrow={teaser.eyebrow} title={teaser.title}>
          {teaser.text}
        </SectionHeading>
        <Reveal className="gifts-teaser__cards" delay={150}>
          <a className="gifts-teaser__card" href={`${href}#wishlist`} onClick={linkHandler(`${href}#wishlist`)}>
            <GiftBoxArt />
            <span className="label">Our Wishlist</span>
            <span className="gifts-teaser__hint">Reserve a gift, privately</span>
          </a>
          <a className="gifts-teaser__card" href={`${href}#dreams`} onClick={linkHandler(`${href}#dreams`)}>
            <DreamArt />
            <span className="label">Our Dreams</span>
            <span className="gifts-teaser__hint">Help a dream come true</span>
          </a>
        </Reveal>
        <Reveal className="button-row" delay={250}>
          <a className="button button--gold" href={href} onClick={linkHandler(href)}>
            {teaser.cta}
          </a>
        </Reveal>
      </div>
    </section>
  );
}

function GiftBoxArt() {
  return (
    <svg className="gifts-teaser__art" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="12" y="26" width="40" height="28" rx="2" />
      <rect x="9" y="19" width="46" height="8" rx="2" />
      <path d="M32 19v35" />
      <path d="M32 19c-4-8-14-10-14-4 0 3 6 4 14 4zM32 19c4-8 14-10 14-4 0 3-6 4-14 4z" />
    </svg>
  );
}

function DreamArt() {
  return (
    <svg className="gifts-teaser__art" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M6 50l16-20 9 11 8-9 19 18z" />
      <path d="M22 30l4 5M39 32l3 3" />
      <circle cx="46" cy="16" r="6" />
      <path d="M8 56h48" />
    </svg>
  );
}
