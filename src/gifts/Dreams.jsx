import { useEffect, useState } from 'react';
import { gifts as giftsConfig } from '../config.js';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { api, formatINR } from '../lib/api.js';
import { linkHandler, withGuest } from '../lib/router.js';
import { WEDDING } from './GiftsPage.jsx';

export function DreamProgress({ dream }) {
  return (
    <div className="dream-progress">
      <div
        className="dream-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={dream.progress}
        aria-label={`${dream.title}: ${dream.progress}% of the goal`}
      >
        <span className="dream-progress__fill" style={{ '--progress': `${dream.progress}%` }} />
      </div>
      <p className="dream-progress__numbers">
        <span>
          <strong>{formatINR(dream.raisedAmount)}</strong> of {formatINR(dream.targetAmount)}
        </span>
        <span className="dream-progress__pct">{dream.progress}%</span>
      </p>
    </div>
  );
}

export function Dreams({ guest }) {
  const [state, setState] = useState({ status: 'loading', dreams: [] });

  useEffect(() => {
    const ctrl = new AbortController();
    api(`${WEDDING}/dreams`, { signal: ctrl.signal })
      .then(({ dreams }) => setState({ status: 'ready', dreams }))
      .catch((error) => error.name !== 'AbortError' && setState({ status: 'error', dreams: [], error }));
    return () => ctrl.abort();
  }, []);

  if (state.status === 'ready' && !state.dreams.length) return null;
  const { dreams } = giftsConfig;

  return (
    <section className="section tone-ivory dreams" id="dreams" aria-labelledby="dreams-title">
      <div className="container">
        <SectionHeading id="dreams-title" eyebrow={dreams.eyebrow} title={dreams.title}>
          {dreams.intro}
        </SectionHeading>
        {state.status === 'error' && (
          <p className="gifts-empty lede" role="alert">
            {state.error.message}
          </p>
        )}
        {state.status === 'loading' && <div className="dream-grid dream-grid--loading" aria-hidden="true" />}
        {state.status === 'ready' && (
          <ul className="dream-grid" data-testid="dream-grid">
            {state.dreams.map((dream) => {
              const href = withGuest(`/gifts/dream/${dream.slug}`, guest);
              return (
                <li key={dream.id} className="dream-card" data-testid="dream-card">
                  <div className="dream-card__frame">
                    {dream.image && (
                      <img src={dream.image} alt="" width="1200" height="800" loading="lazy" decoding="async" className="dream-card__img" />
                    )}
                  </div>
                  <div className="dream-card__body">
                    <h3 className="dream-card__title">{dream.title}</h3>
                    {dream.description && <p className="dream-card__desc">{dream.description}</p>}
                    <DreamProgress dream={dream} />
                    <a className="button" href={href} onClick={linkHandler(href)}>
                      Contribute<span className="visually-hidden"> to {dream.title}</span>
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
