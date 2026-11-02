import { useEffect, useRef } from 'react';
import { couple, dates, invitation, venue } from '../config.js';
import { Monogram } from '../components/Monogram.jsx';
import { Mandala, Toran } from '../components/Motifs.jsx';
import { prefersReducedMotion } from '../lib/motion.js';
import './Hero.css';

export function Hero({ guest }) {
  const ref = useRef(null);

  // Soft parallax: one CSS variable drives the decorative layers.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const el = ref.current;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.5) el.style.setProperty('--hero-scroll', y.toFixed(1));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const city = venue.city.split(',')[0];

  return (
    <section ref={ref} className="hero tone-ivory" id="top" aria-labelledby="hero-title">
      <div className="hero__backdrop" aria-hidden="true">
        <div className="hero__mandala-wrap">
          <Mandala className="hero__mandala" />
        </div>
      </div>
      <Toran className="hero__toran" />

      <div className="hero__arch">
        <div className="hero__inner">
          {guest && (
            <p className="hero__greeting hero__item" style={{ '--i': 0 }}>
              {invitation.personalGreeting.replace('{guest}', guest)}
            </p>
          )}
          <Monogram className="hero__monogram hero__item" style={{ '--i': 1 }} />
          <p className="label hero__eyebrow hero__item" style={{ '--i': 2 }}>
            {invitation.eyebrow}
          </p>
          <p className="hero__line hero__item" style={{ '--i': 3 }}>
            {invitation.line}
          </p>
          <h1 id="hero-title" className="script hero__names hero__item" style={{ '--i': 4 }}>
            <span className="hero__name">{couple.bride.name}</span>
            <span className="hero__amp">&amp;</span>
            <span className="hero__name">{couple.groom.name}</span>
          </h1>
          <div className="hero__parents hero__item" style={{ '--i': 5 }}>
            <p>
              <span className="label">{couple.bride.relation}</span>
              {couple.bride.parents}
            </p>
            <span className="hero__parents-rule" aria-hidden="true" />
            <p>
              <span className="label">{couple.groom.relation}</span>
              {couple.groom.parents}
            </p>
          </div>
          <p className="label hero__date hero__item" style={{ '--i': 6 }}>
            <time dateTime={dates.start.slice(0, 10)}>{dates.display}</time>
            <span aria-hidden="true"> · </span>
            {city}
          </p>
        </div>
      </div>

      <a className="hero__scroll hero__item" style={{ '--i': 7 }} href="#story">
        <span className="label">Our story</span>
        <span className="hero__scroll-line" aria-hidden="true" />
      </a>
    </section>
  );
}
