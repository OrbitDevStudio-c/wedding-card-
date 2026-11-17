import { useI18n } from '../i18n/index.jsx';
import { Icon } from '../components/Icon.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { MarigoldGarland, PaintedFeather, RoyalElephant } from '../components/Painted.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import './Events.css';

function EventCard({ event, index }) {
  const { t } = useI18n();
  return (
    <Reveal as="li" className="event-card" delay={index * 120} data-event={event.id} style={{ '--event-accent': event.palette[0].hex }}>
      <span className="event-card__icon" aria-hidden="true">
        <Icon name={event.icon} />
      </span>
      <h4 className="script event-card__name">{event.name}</h4>
      <p className="label event-card__time">{event.time}</p>
      <p className="event-card__place">{event.place}</p>
      <p className="event-card__text">{event.description}</p>
      <div className="event-card__dress">
        <p className="label event-card__dress-label">{t('events.dress', { dress: event.dressCode })}</p>
        <ul className="event-card__chips" aria-label={t('events.colours', { event: event.name })}>
          {event.palette.map((c) => (
            <li key={c.hex} className="chip">
              <span className="chip__swatch" style={{ '--swatch': c.hex }} aria-hidden="true" />
              {c.name}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

export function Events() {
  const { t, content } = useI18n();
  const { days, events } = content;
  return (
    <section className="section tone-parchment events" id="events" aria-labelledby="events-title">
      <MarigoldGarland className="events__garland" count={21} />
      <div className="container">
        <SectionHeading id="events-title" eyebrow={t('events.eyebrow')} title={t('events.title')}>
          {t('events.lede')}
        </SectionHeading>
        {days.map((day, dayIndex) => {
          const dayEvents = events.filter((e) => e.date === day.date);
          return (
            <div className="events__day" key={day.date}>
              {dayIndex > 0 && (
                <div className="events__divider" aria-hidden="true">
                  <RoyalElephant className="events__elephant" />
                  <PaintedFeather className="events__feather" />
                  <RoyalElephant className="events__elephant" flip />
                </div>
              )}
              <Reveal as="h3" className="events__day-title">
                <span className="label">{day.label}</span>
                <span className="events__day-date">{day.title}</span>
              </Reveal>
              <ul className={`events__grid events__grid--${dayEvents.length}`}>
                {dayEvents.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
