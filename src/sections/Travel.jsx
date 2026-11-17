import { useId, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { Icon } from '../components/Icon.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import './Travel.css';

const mapsSearch = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <li className={`faq__item ${open ? 'is-open' : ''}`}>
      <h4 className="faq__question">
        <button type="button" aria-expanded={open} aria-controls={`${id}-panel`} id={`${id}-button`} onClick={() => setOpen(!open)}>
          <span>{q}</span>
          <span className="faq__icon" aria-hidden="true">
            <Icon name="plus" />
          </span>
        </button>
      </h4>
      <div className="faq__answer" id={`${id}-panel`} role="region" aria-labelledby={`${id}-button`} hidden={!open}>
        <p>{a}</p>
      </div>
    </li>
  );
}

export function Travel() {
  const { t, content } = useI18n();
  const { travel, venue } = content;
  const city = venue.city.split(',')[0];
  return (
    <section className="section tone-ivory travel" id="travel" aria-labelledby="travel-title">
      <div className="container">
        <SectionHeading id="travel-title" eyebrow={t('travel.eyebrow', { city })} title={t('travel.title')} />

        <ul className="travel__modes">
          {travel.modes.map((mode, i) => (
            <Reveal as="li" key={mode.icon} className="travel__mode" delay={i * 120}>
              <span className="travel__mode-icon" aria-hidden="true">
                <Icon name={mode.icon} />
              </span>
              <h3 className="travel__mode-title">{mode.title}</h3>
              <p>{mode.text}</p>
            </Reveal>
          ))}
        </ul>

        <Reveal as="p" className="travel__shuttle">
          <Icon name="car" />
          {travel.shuttleNote}
        </Reveal>

        <div className="travel__columns">
          <Reveal className="travel__block">
            <h3 className="travel__block-title">{t('travel.stay')}</h3>
            <ul className="hotels">
              {travel.hotels.map((hotel) => (
                <li key={hotel.name} className="hotel">
                  <div>
                    <p className="hotel__name">{hotel.name}</p>
                    <p className="hotel__note">{hotel.note}</p>
                  </div>
                  <a
                    className="hotel__map"
                    href={mapsSearch(`${hotel.name}, ${venue.city}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('travel.hotelMap', { hotel: hotel.name, distance: hotel.distance })}
                  >
                    <Icon name="pin" />
                    <span className="label">{hotel.distance}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="travel__block" delay={150}>
            <h3 className="travel__block-title">{t('travel.faq')}</h3>
            <ul className="faq">
              {travel.faq.map((item, i) => (
                <FaqItem key={i} {...item} />
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
