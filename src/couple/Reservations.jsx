import { useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { api, formatDate } from '../lib/api.js';
import { ConfirmDialog, LoadError, Loading, StatusBadge, useResource } from './shared.jsx';

export function Reservations({ onAuthError }) {
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState('active');
  const [state, reload, setState] = useResource(`/couple/reservations${filter === 'active' ? '?status=active' : ''}`, onAuthError);
  const [confirm, setConfirm] = useState(null);
  const [actionError, setActionError] = useState('');

  const replace = (updated) =>
    setState((s) => ({
      ...s,
      data: {
        reservations: s.data.reservations
          .map((r) => (r.id === updated.id ? updated : r))
          .filter((r) => filter === 'all' || r.status !== 'released'),
      },
    }));

  const markReceived = async (r) => {
    setActionError('');
    try {
      const { reservation } = await api(`/couple/reservations/${r.id}/mark-received`, { method: 'POST' });
      replace(reservation);
    } catch (err) {
      onAuthError(err);
      setActionError(err.message);
    }
  };

  return (
    <div className="couple-stack">
      <p className="couple-muted">{t('res.intro')}</p>
      <div className="chips chips--start" role="group" aria-label={t('res.show')}>
        {[
          ['active', t('res.active')],
          ['all', t('res.allInc')],
        ].map(([id, label]) => (
          <button key={id} type="button" className="chip" aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      {actionError && (
        <p className="form-alert" role="alert">
          {actionError}
        </p>
      )}
      {state.status === 'loading' && <Loading />}
      {state.status === 'error' && <LoadError error={state.error} retry={reload} />}
      {state.status === 'ready' && !state.data.reservations.length && (
        <p className="couple-card couple-muted">{filter === 'active' ? t('res.noneActive') : t('res.none')}</p>
      )}
      {state.status === 'ready' && state.data.reservations.length > 0 && (
        <table className="rtable" data-testid="reservations-table">
          <thead>
            <tr>
              <th scope="col">{t('res.gift')}</th>
              <th scope="col">{t('res.by')}</th>
              <th scope="col">{t('res.date')}</th>
              <th scope="col">{t('res.status')}</th>
              <th scope="col">
                <span className="visually-hidden">{t('res.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {state.data.reservations.map((r) => (
              <tr key={r.id} data-testid="reservation-row">
                <td data-label={t('res.gift')}>
                  <strong>{r.giftName}</strong>
                </td>
                <td data-label={t('res.by')}>
                  <div>{r.guestName}</div>
                  {r.guestPhone && (
                    <a className="couple-link" href={`tel:${r.guestPhone.replace(/[^\d+]/g, '')}`}>
                      {r.guestPhone}
                    </a>
                  )}
                  {r.message && <blockquote className="rtable__message">“{r.message}”</blockquote>}
                </td>
                <td data-label={t('res.date')}>{formatDate(r.reservedAt, locale)}</td>
                <td data-label={t('res.status')}>
                  <StatusBadge status={r.status} />
                </td>
                <td data-label={t('res.actions')} className="rtable__actions">
                  {r.status === 'reserved' && (
                    <button type="button" className="button button--ghost button--small" onClick={() => markReceived(r)}>
                      {t('res.markReceived')}
                    </button>
                  )}
                  {r.status !== 'released' && (
                    <button type="button" className="button button--ghost button--small" onClick={() => setConfirm(r)}>
                      {t('res.release')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={t('res.confirmTitle')}
        body={confirm ? t('res.confirmBody', { gift: confirm.giftName, guest: confirm.guestName }) : ''}
        confirmLabel={t('res.confirm')}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          const { reservation } = await api(`/couple/reservations/${confirm.id}/release`, { method: 'POST' });
          replace(reservation);
        }}
      />
    </div>
  );
}
