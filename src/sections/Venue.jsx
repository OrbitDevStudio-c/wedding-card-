import { useI18n } from '../i18n/index.jsx';
import { Icon } from '../components/Icon.jsx';
import { PalaceIllustration } from '../components/PalaceIllustration.jsx';
import { Lotus } from '../components/Painted.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import './Venue.css';

export function Venue() {
  const { t, content } = useI18n();
  const { dates, venue } = content;
  return (
    <section className="section tone-ivory venue" id="venue" aria-labelledby="venue-title">
      <div className="container">
        <SectionHeading id="venue-title" eyebrow={t('venue.eyebrow')} title={t('venue.title')} />
        <div className="venue__layout">
          <div className="venue__art">
            <PalaceIllustration />
            <div className="venue__lotuses" aria-hidden="true">
              <Lotus className="venue__lotus" />
              <Lotus className="venue__lotus venue__lotus--big" />
              <Lotus className="venue__lotus" />
            </div>
          </div>
          <Reveal className="venue__card" delay={200}>
            <h3 className="venue__name">{venue.name}</h3>
            <address className="venue__address">
              {venue.address}
              <br />
              {venue.city}
            </address>
            <p className="label venue__dates">{dates.display}</p>
            <a className="button" href={venue.mapsUrl} target="_blank" rel="noopener noreferrer" data-testid="view-location">
              <Icon name="pin" />
              {t('venue.map')}
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
