import { dates, venue } from '../config.js';
import { Icon } from '../components/Icon.jsx';
import { PalaceIllustration } from '../components/PalaceIllustration.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import './Venue.css';

export function Venue() {
  return (
    <section className="section tone-ivory venue" id="venue" aria-labelledby="venue-title">
      <div className="container">
        <SectionHeading id="venue-title" eyebrow="The celebration will take place at" title="The Venue" />
        <div className="venue__layout">
          <div className="venue__art">
            <PalaceIllustration />
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
              View location
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
