import { days, events } from '../config.js';
import { Icon } from '../components/Icon.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import './Events.css';

function EventCard({ event, index }) {
  return (
    <Reveal as="li" className="event-card" delay={index * 120} data-event={event.id}>
      <span className="event-card__icon" aria-hidden="true">
        <Icon name={event.icon} />
      </span>
      <h4 className="script event-card__name">{event.name}</h4>
      <p className="label event-card__time">{event.time}</p>
      <p className="event-card__place">{event.place}</p>
      <p className="event-card__text">{event.description}</p>
      <div className="event-card__dress">
        <p className="label event-card__dress-label">Dress code · {event.dressCode}</p>
        <ul className="event-card__chips" aria-label={`Suggested colours for ${event.name}`}>
          {event.palette.map((c) => (
            <li key={c.name} className="chip">
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
  return (
    <section className="section tone-parchment events" id="events" aria-labelledby="events-title">
      <div className="container">
        <SectionHeading id="events-title" eyebrow="Two days of festivities" title="The Celebrations">
          Every ceremony has its own colours. Here is what to expect, and what to wear.
        </SectionHeading>
        {days.map((day) => {
          const dayEvents = events.filter((e) => e.date === day.date);
          return (
            <div className="events__day" key={day.date}>
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
