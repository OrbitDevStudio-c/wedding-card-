import { useEffect, useMemo, useState } from 'react';
import { dates } from '../config.js';
import { useI18n } from '../i18n/index.jsx';
import { Icon } from '../components/Icon.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { useCountdown } from '../hooks/useCountdown.js';
import { buildIcs, googleCalendarUrl } from '../lib/calendar.js';
import './Countdown.css';

const UNITS = ['days', 'hours', 'minutes', 'seconds'];

const pad = (n) => String(n).padStart(2, '0');


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
  const { t, content, locale } = useI18n();
  const first = content.events[0];
  // Memoised per language: Intl formatters are costly and this component re-renders every second
  const caption = useMemo(() => {
    const date = new Intl.DateTimeFormat(locale === 'gu-IN' ? 'gu-IN' : 'en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Asia/Kolkata',
      numberingSystem: 'latn',
    }).format(new Date(first.start));
    return t('countdown.caption', { event: first.name, date, time: first.time.split(' –')[0] });
  }, [t, locale, first]);

  return (
    <section className="section tone-dark tone-peacock has-scallop-bottom countdown" id="countdown" aria-labelledby="countdown-title">
      <div className="container">
        <SectionHeading id="countdown-title" eyebrow={t('countdown.eyebrow', { event: first.name })} title={t('countdown.title')} />

        <Reveal>
          {remaining.done ? (
            <p className="countdown__done script">{t('countdown.done')}</p>
          ) : (
            <div className="countdown__grid" role="timer" aria-label={t('countdown.aria')}>
              {UNITS.map((key) => (
                <div className="countdown__tile" key={key} data-unit={key}>
                  <span className="countdown__value">
                    <span className="countdown__num" key={remaining[key]}>
                      {pad(remaining[key])}
                    </span>
                  </span>
                  <span className="label countdown__label">{t(`countdown.${key}`)}</span>
                </div>
              ))}
            </div>
          )}
          <p className="countdown__caption">{caption}</p>
        </Reveal>

        <Reveal className="countdown__calendar" delay={150}>
          <p className="label countdown__calendar-label">{t('countdown.calendar')}</p>
          <div className="button-row">
            <a className="button button--gold" href={googleUrl} target="_blank" rel="noopener noreferrer" data-testid="google-calendar">
              <Icon name="calendar" />
              {t('countdown.google')}
            </a>
            <a className="button button--ghost" href={icsUrl || undefined} download="alica-rushil-wedding.ics" data-testid="ics-download">
              <Icon name="download" />
              {t('countdown.ics')}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
