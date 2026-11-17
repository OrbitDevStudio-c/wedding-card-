import { useI18n } from '../i18n/index.jsx';
import { formatDate, formatINR } from '../lib/api.js';
import { LoadError, Loading, StatusBadge, useResource } from './shared.jsx';

export function Contributions({ me, onAuthError }) {
  const { t, locale } = useI18n();
  const [state, reload] = useResource('/couple/contributions', onAuthError);
  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') return <LoadError error={state.error} retry={reload} />;
  const rows = state.data.contributions;
  return (
    <div className="couple-stack">
      <p className="couple-muted">
        {t('contrib.intro')} {me.payments.mode === 'demo' && t('contrib.demo')}
      </p>
      {!rows.length ? (
        <p className="couple-card couple-muted">{t('contrib.none')}</p>
      ) : (
        <table className="rtable" data-testid="contributions-table">
          <thead>
            <tr>
              <th scope="col">{t('contrib.dream')}</th>
              <th scope="col">{t('contrib.from')}</th>
              <th scope="col">{t('contrib.amount')}</th>
              <th scope="col">{t('res.date')}</th>
              <th scope="col">{t('res.status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td data-label={t('contrib.dream')}>{c.dreamTitle}</td>
                <td data-label={t('contrib.from')}>
                  <div>{c.contributorName}</div>
                  {c.message && <blockquote className="rtable__message">“{c.message}”</blockquote>}
                </td>
                <td data-label={t('contrib.amount')}>{formatINR(c.amount)}</td>
                <td data-label={t('res.date')}>{formatDate(c.paidAt || c.createdAt, locale)}</td>
                <td data-label={t('res.status')}>
                  <StatusBadge status={c.paymentStatus} />
                  {c.paymentReference && <div className="couple-muted rtable__ref">{c.paymentReference}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
