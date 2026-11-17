import { useI18n } from '../i18n/index.jsx';
import { formatDate, formatINR } from '../lib/api.js';
import { linkHandler } from '../lib/router.js';
import { LoadError, Loading, StatusBadge, useResource } from './shared.jsx';

export function Overview({ me, onAuthError }) {
  const { t, locale } = useI18n();
  const [state, reload] = useResource('/couple/dashboard', onAuthError);
  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') return <LoadError error={state.error} retry={reload} />;
  const { stats, recent } = state.data;
  const cards = [
    { label: t('overview.gifts'), value: stats.totalGifts },
    { label: t('overview.available'), value: stats.availableGifts },
    { label: t('overview.reserved'), value: stats.reservedGifts, note: stats.receivedGifts ? t('overview.receivedN', { n: stats.receivedGifts }) : null },
    { label: t('overview.dreams'), value: stats.totalDreams },
    {
      label: t('overview.contributions'),
      value: formatINR(stats.contributionsTotal),
      note: `${t('overview.verified', { n: stats.contributionsCount })}${stats.demoPledges ? ` · ${t('overview.pledges', { n: stats.demoPledges })}` : ''}`,
    },
  ];
  return (
    <div className="couple-stack">
      {me.payments.mode === 'demo' && (
        <p className="form-note">
          <strong>{t('overview.demo')}</strong> {t('overview.demoText')}
        </p>
      )}
      <ul className="stat-grid" data-testid="stats">
        {cards.map((c) => (
          <li key={c.label} className="stat">
            <span className="label stat__label">{c.label}</span>
            <span className="stat__value">{c.value}</span>
            {c.note && <span className="stat__note">{c.note}</span>}
          </li>
        ))}
      </ul>
      <section className="couple-card" aria-labelledby="recent-title">
        <div className="couple-card__head">
          <h2 id="recent-title" className="couple-h2">
            {t('overview.recent')}
          </h2>
          <a href="/couple/dashboard/reservations" onClick={linkHandler('/couple/dashboard/reservations')} className="couple-link">
            {t('overview.all')}
          </a>
        </div>
        {recent.length ? (
          <ul className="activity">
            {recent.map((r) => (
              <li key={r.id} className="activity__item">
                <div>
                  {t('overview.reservedLine', { guest: r.guestName, gift: r.giftName })}
                  <span className="couple-muted"> · {formatDate(r.releasedAt || r.receivedAt || r.reservedAt, locale)}</span>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="couple-muted">{t('overview.none')}</p>
        )}
      </section>
    </div>
  );
}
