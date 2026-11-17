import { useI18n } from '../i18n/index.jsx';
import { Mandala } from '../components/Motifs.jsx';
import { Lotus, RoyalElephant } from '../components/Painted.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { linkHandler, withGuest } from '../lib/router.js';
import './GiftsTeaser.css';

// The invitation's doorway to the gifts page. It links rather than embeds, so none of the
// wishlist code or data loads until a guest chooses to look.
export function GiftsTeaser({ guest }) {
  const { t, content } = useI18n();
  const href = withGuest('/gifts', guest);
  const { teaser } = content.gifts;
  return (
    <section
      className="section tone-dark tone-maroon has-scallop has-scallop-bottom gifts-teaser"
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
            <RoyalElephant className="gifts-teaser__painted" />
            <span className="label">{t('teaser.wishlist')}</span>
            <span className="gifts-teaser__hint">{t('teaser.wishlistHint')}</span>
          </a>
          <a className="gifts-teaser__card" href={`${href}#dreams`} onClick={linkHandler(`${href}#dreams`)}>
            <Lotus className="gifts-teaser__painted gifts-teaser__painted--lotus" />
            <span className="label">{t('teaser.dreams')}</span>
            <span className="gifts-teaser__hint">{t('teaser.dreamsHint')}</span>
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
