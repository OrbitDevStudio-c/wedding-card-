import { useState } from 'react';
import { api, formatDate } from '../lib/api.js';
import { ConfirmDialog, LoadError, Loading, StatusBadge, useResource } from './shared.jsx';

export function Reservations({ onAuthError }) {
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
      <p className="couple-muted">
        Only you can see this page. Guests never see who reserved a gift. Reservations stay active until you release them.
      </p>
      <div className="chips chips--start" role="group" aria-label="Show reservations">
        {[
          ['active', 'Active'],
          ['all', 'All, including released'],
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
        <p className="couple-card couple-muted">No reservations {filter === 'active' ? 'are active' : 'yet'}.</p>
      )}
      {state.status === 'ready' && state.data.reservations.length > 0 && (
        <table className="rtable" data-testid="reservations-table">
          <thead>
            <tr>
              <th scope="col">Gift</th>
              <th scope="col">Reserved by</th>
              <th scope="col">Date</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {state.data.reservations.map((r) => (
              <tr key={r.id} data-testid="reservation-row">
                <td data-label="Gift">
                  <strong>{r.giftName}</strong>
                </td>
                <td data-label="Reserved by">
                  <div>{r.guestName}</div>
                  {r.guestPhone && (
                    <a className="couple-link" href={`tel:${r.guestPhone.replace(/[^\d+]/g, '')}`}>
                      {r.guestPhone}
                    </a>
                  )}
                  {r.message && <blockquote className="rtable__message">“{r.message}”</blockquote>}
                </td>
                <td data-label="Date">{formatDate(r.reservedAt)}</td>
                <td data-label="Status">
                  <StatusBadge status={r.status} />
                </td>
                <td data-label="Actions" className="rtable__actions">
                  {r.status === 'reserved' && (
                    <button type="button" className="button button--ghost button--small" onClick={() => markReceived(r)}>
                      Mark received
                    </button>
                  )}
                  {r.status !== 'released' && (
                    <button type="button" className="button button--ghost button--small" onClick={() => setConfirm(r)}>
                      Release
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
        title="Release this reservation?"
        body={confirm ? `“${confirm.giftName}” will go back on the public wishlist, and ${confirm.guestName}'s reservation will be marked as released. This cannot be undone.` : ''}
        confirmLabel="Release gift"
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          const { reservation } = await api(`/couple/reservations/${confirm.id}/release`, { method: 'POST' });
          replace(reservation);
        }}
      />
    </div>
  );
}
