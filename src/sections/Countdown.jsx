import { useEffect, useMemo, useState } from 'react';
import { dates, events } from '../config.js';
import { Icon } from '../components/Icon.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { useCountdown } from '../hooks/useCountdown.js';
import { buildIcs, googleCalendarUrl } from '../lib/calendar.js';
import './Countdown.css';

const UNITS = [
  ['days', 'Days'],
  ['hours', 'Hours'],
  ['minutes', 'Mins'],
  ['seconds', 'Secs'],
];

const pad = (n) => String(n).padStart(2, '0');

const first = events[0];
// Built once: Intl formatters are costly and this component re-renders every second
const caption = `${first.name} begins on ${new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Asia/Kolkata',
}).format(new Date(first.start))} at ${first.time.split(' –')[0]} IST`;

function useIcsUrl() {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const href = URL.createObjectURL(new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' }));
    setUrl(href);
    return () => URL.revokeObjectURL(href);
  }, []);
  return url;
}

export function Countdown() {
  const remaining = useCountdown(dates.start);
  const icsUrl = useIcsUrl();
  const googleUrl = useMemo(googleCalendarUrl, []);

  return (
    <section className="section tone-dark has-scallop-bottom countdown" id="countdown" aria-labelledby="countdown-title">
      <div className="container">
        <SectionHeading id="countdown-title" eyebrow={`Until the ${first.name}`} title="Counting the Moments" />

        <Reveal>
          {remaining.done ? (
            <p className="countdown__done script">The celebrations have begun!</p>
          ) : (
            <div className="countdown__grid" role="timer" aria-label="Time remaining until the celebrations begin">
              {UNITS.map(([key, label]) => (
                <div className="countdown__tile" key={key} data-unit={key}>
                  <span className="countdown__value">
                    <span className="countdown__num" key={remaining[key]}>
                      {pad(remaining[key])}
                    </span>
                  </span>
                  <span className="label countdown__label">{label}</span>
                </div>
              ))}
            </div>
          )}
          <p className="countdown__caption">{caption}</p>
        </Reveal>

        <Reveal className="countdown__calendar" delay={150}>
          <p className="label countdown__calendar-label">Add to your calendar</p>
          <div className="button-row">
            <a className="button button--gold" href={googleUrl} target="_blank" rel="noopener noreferrer" data-testid="google-calendar">
              <Icon name="calendar" />
              Google Calendar
            </a>
            <a className="button button--ghost" href={icsUrl || undefined} download="alica-rushil-wedding.ics" data-testid="ics-download">
              <Icon name="download" />
              Apple / Outlook (.ics)
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
