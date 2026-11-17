import { useCallback, useRef, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { ScratchCard } from '../components/ScratchCard.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { FloralCorner } from '../components/Painted.jsx';
import { petals } from '../lib/petals.js';
import './DateReveal.css';

export function DateReveal() {
  const { t, content } = useI18n();
  const { dates, venue } = content;
  const [revealed, setRevealed] = useState(false);
  const cardRef = useRef(null);
  const doneRef = useRef(false);
  const { reveal } = dates;

  const onReveal = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setRevealed(true);
    const rect = cardRef.current.getBoundingClientRect();
    petals.burst(rect.left + rect.width / 2, rect.top + rect.height * 0.4, 56);
  }, []);

  return (
    <section className="section tone-dark has-scallop date-reveal" id="date" aria-labelledby="date-title" style={{ '--scallop-from': 'var(--ivory-100)' }}>
      <div className="container">
        <SectionHeading id="date-title" eyebrow={t('date.eyebrow')} title={t('date.title')}>
          {t('date.lede')}
        </SectionHeading>

        <Reveal className="date-reveal__stage">
          <div ref={cardRef} className="date-card">
            <FloralCorner className="date-card__corner date-card__corner--left" />
            <FloralCorner className="date-card__corner date-card__corner--right" />
            <ScratchCard revealed={revealed} onReveal={onReveal}>
              <div className="date-card__face">
                <p className="label date-card__weekdays">{reveal.weekdays}</p>
                <p className="date-card__days">{reveal.days}</p>
                <p className="script date-card__month">{reveal.month}</p>
                <p className="label date-card__year">{reveal.year}</p>
                <p className="date-card__place">{venue.city.split(',')[0]}</p>
              </div>
            </ScratchCard>
          </div>

          <div className="date-reveal__actions">
            {revealed ? (
              <p className="date-reveal__done">{t('date.done', { city: venue.city.split(',')[0] })}</p>
            ) : (
              <button type="button" className="button button--ghost" onClick={onReveal}>
                {t('date.reveal')}
              </button>
            )}
          </div>
          <p className="visually-hidden" aria-live="polite">
            {revealed
              ? t('date.announce', { weekdays: reveal.weekdays, days: reveal.days.replace('·', t('date.and')), month: reveal.month, year: reveal.year })
              : ''}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
