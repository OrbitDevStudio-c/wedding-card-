import { formatDate, formatINR } from '../lib/api.js';
import { linkHandler } from '../lib/router.js';
import { LoadError, Loading, StatusBadge, useResource } from './shared.jsx';

export function Overview({ me, onAuthError }) {
  const [state, reload] = useResource('/couple/dashboard', onAuthError);
  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') return <LoadError error={state.error} retry={reload} />;
  const { stats, recent } = state.data;
  const cards = [
    { label: 'Wishlist gifts', value: stats.totalGifts },
    { label: 'Available', value: stats.availableGifts },
    { label: 'Reserved', value: stats.reservedGifts, note: stats.receivedGifts ? `${stats.receivedGifts} received` : null },
    { label: 'Dream goals', value: stats.totalDreams },
    {
      label: 'Dream contributions',
      value: formatINR(stats.contributionsTotal),
      note: `${stats.contributionsCount} verified online${stats.demoPledges ? ` · ${stats.demoPledges} demo pledges` : ''}`,
    },
  ];
  return (
    <div className="couple-stack">
      {me.payments.mode === 'demo' && (
        <p className="form-note">
          <strong>Payments are in demo mode.</strong> Guests can pledge towards dreams, but no money is collected and pledges do not
          count towards totals. Add Razorpay keys on the server to accept real contributions.
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
            Recent reservation activity
          </h2>
          <a href="/couple/dashboard/reservations" onClick={linkHandler('/couple/dashboard/reservations')} className="couple-link">
            All reservations
          </a>
        </div>
        {recent.length ? (
          <ul className="activity">
            {recent.map((r) => (
              <li key={r.id} className="activity__item">
                <div>
                  <strong>{r.guestName}</strong> reserved <strong>{r.giftName}</strong>
                  <span className="couple-muted"> · {formatDate(r.releasedAt || r.receivedAt || r.reservedAt)}</span>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="couple-muted">No reservations yet. Share your gift page with guests from the Share &amp; QR tab.</p>
        )}
      </section>
    </div>
  );
}
