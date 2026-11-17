import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { FloralCorner } from '../components/Painted.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { api, formatINR } from '../lib/api.js';
import { WEDDING } from './GiftsPage.jsx';
import { ReserveDialog } from './ReserveDialog.jsx';

export function Wishlist({ guest }) {
  const { t, content, errorText } = useI18n();
  const giftsConfig = content.gifts;
  const categoryLabel = (id) => giftsConfig.categories.find((c) => c.id === id)?.label || id;
  const [state, setState] = useState({ status: 'loading', gifts: [] });
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const { gifts } = await api(`${WEDDING}/gifts`);
      setState({ status: 'ready', gifts });
    } catch (error) {
      setState((s) => ({ ...s, status: 'error', error }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Scroll to #wishlist / #dreams once the content they point at exists.
  useEffect(() => {
    if (state.status !== 'ready' || !window.location.hash) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, [state.status]);

  const present = useMemo(() => new Set(state.gifts.map((g) => g.category)), [state.gifts]);
  const filters = giftsConfig.categories.filter((c) => present.has(c.id));
  const visible = category === 'all' ? state.gifts : state.gifts.filter((g) => g.category === category);

  // If the chosen category empties (its last gift was just reserved), fall back to all.
  useEffect(() => {
    if (category !== 'all' && state.status === 'ready' && !present.has(category)) setCategory('all');
  }, [category, present, state.status]);

  const onReserved = useCallback(() => load(), [load]);

  const { wishlist } = giftsConfig;
  return (
    <section className="section tone-parchment wishlist" id="wishlist" aria-labelledby="wishlist-title">
      <div className="container">
        <SectionHeading id="wishlist-title" eyebrow={wishlist.eyebrow} title={wishlist.title}>
          {wishlist.intro}
        </SectionHeading>

        {state.status === 'ready' && filters.length > 1 && (
          <div className="chips wishlist__filters" role="group" aria-label={t('wishlist.filter')}>
            {[{ id: 'all', label: t('wishlist.all') }, ...filters].map((c) => (
              <button
                key={c.id}
                type="button"
                className="chip"
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        <div aria-live="polite" className="visually-hidden">
          {state.status === 'ready' ? (visible.length === 1 ? t('wishlist.countOne') : t('wishlist.count', { n: visible.length })) : ''}
        </div>

        {state.status === 'loading' && (
          <ul className="gift-grid" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="gift-card gift-card--skeleton" />
            ))}
          </ul>
        )}

        {state.status === 'error' && (
          <div className="gifts-empty" role="alert">
            <p className="lede">{state.error ? errorText(state.error) : t('wishlist.loadError')}</p>
            <button type="button" className="button" onClick={load}>
              {t('gifts.tryAgain')}
            </button>
          </div>
        )}

        {state.status === 'ready' && !state.gifts.length && (
          <div className="gifts-empty" data-testid="wishlist-empty">
            <svg className="gifts-empty__art" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
              <path d="M32 54c-12-8-22-17-22-28a11 11 0 0 1 22-4 11 11 0 0 1 22 4c0 11-10 20-22 28z" />
            </svg>
            <h3 className="script gifts-empty__title">{wishlist.emptyTitle}</h3>
            <p className="lede">{wishlist.emptyText}</p>
            <a className="button button--ghost" href="#dreams">
              {t('wishlist.seeDreams')}
            </a>
          </div>
        )}

        {state.status === 'ready' && state.gifts.length > 0 && (
          <ul className="gift-grid" data-testid="gift-grid">
            {visible.map((gift) => (
              <GiftCard key={gift.id} gift={gift} category={categoryLabel(gift.category)} onReserve={() => setSelected(gift)} />
            ))}
          </ul>
        )}
      </div>

      <ReserveDialog gift={selected} guest={guest} onClose={() => setSelected(null)} onReserved={onReserved} />
    </section>
  );
}

function GiftCard({ gift, category, onReserve }) {
  const { t, pick } = useI18n();
  const name = pick(gift, 'name');
  const description = pick(gift, 'description');
  return (
    <li className="gift-card" data-testid="gift-card" data-gift-id={gift.id}>
      <FloralCorner className="gift-card__corner gift-card__corner--left" />
      <FloralCorner className="gift-card__corner gift-card__corner--right" />
      <div className="gift-card__frame">
        {gift.image ? (
          <img className="gift-card__img" src={gift.image} alt={name} width="600" height="600" loading="lazy" decoding="async" />
        ) : (
          <div className="gift-card__img gift-card__img--blank" aria-hidden="true" />
        )}
      </div>
      <div className="gift-card__body">
        <p className="label gift-card__category">{category}</p>
        <h3 className="gift-card__name">{name}</h3>
        {description && <p className="gift-card__desc">{description}</p>}
        {gift.estimatedPrice > 0 && (
          <p className="gift-card__price">
            <span className="gift-card__approx">{t('gift.approx')}</span> {formatINR(gift.estimatedPrice)}
          </p>
        )}
        <div className="gift-card__actions">
          <button type="button" className="button" onClick={onReserve} aria-label={t('gift.reserveAria', { name })}>
            {t('gift.reserve')}
          </button>
          {gift.purchaseUrl && (
            <a className="gift-card__link" href={gift.purchaseUrl} target="_blank" rel="noopener noreferrer nofollow">
              {t('gift.store')}
              <span className="visually-hidden"> {t('common.newTab')}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
