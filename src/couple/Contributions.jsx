import { formatDate, formatINR } from '../lib/api.js';
import { LoadError, Loading, StatusBadge, useResource } from './shared.jsx';

export function Contributions({ me, onAuthError }) {
  const [state, reload] = useResource('/couple/contributions', onAuthError);
  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') return <LoadError error={state.error} retry={reload} />;
  const rows = state.data.contributions;
  return (
    <div className="couple-stack">
      <p className="couple-muted">
        Only payments verified by Razorpay are counted.{' '}
        {me.payments.mode === 'demo' && 'Payments are in demo mode, so guest pledges are listed here but no money has been collected.'}
      </p>
      {!rows.length ? (
        <p className="couple-card couple-muted">No contributions yet.</p>
      ) : (
        <table className="rtable" data-testid="contributions-table">
          <thead>
            <tr>
              <th scope="col">Dream</th>
              <th scope="col">From</th>
              <th scope="col">Amount</th>
              <th scope="col">Date</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td data-label="Dream">{c.dreamTitle}</td>
                <td data-label="From">
                  <div>{c.contributorName}</div>
                  {c.message && <blockquote className="rtable__message">“{c.message}”</blockquote>}
                </td>
                <td data-label="Amount">{formatINR(c.amount)}</td>
                <td data-label="Date">{formatDate(c.paidAt || c.createdAt)}</td>
                <td data-label="Status">
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
