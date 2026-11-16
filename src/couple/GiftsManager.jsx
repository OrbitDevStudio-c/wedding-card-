import { useState } from 'react';
import { gifts as giftsConfig } from '../config.js';
import { Modal } from '../gifts/Modal.jsx';
import { api, formatINR } from '../lib/api.js';
import { ConfirmDialog, ImageField, LoadError, Loading, StatusBadge, TextField, useResource } from './shared.jsx';

const EMPTY = { name: '', description: '', image: '', estimatedPrice: '', purchaseUrl: '', category: 'other', isActive: true };

const giftStatus = (g) => (g.reservation ? g.reservation.status : g.isActive ? 'available' : 'hidden');

export function GiftsManager({ onAuthError }) {
  const [state, reload, setState] = useResource('/couple/gifts', onAuthError);
  const [editing, setEditing] = useState(null); // null | 'new' | gift
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const setGifts = (gifts) => setState((s) => ({ ...s, data: { gifts } }));

  const run = async (fn) => {
    setError('');
    try {
      await fn();
    } catch (err) {
      onAuthError(err);
      setError(err.message);
    }
  };

  const toggle = (g) =>
    run(async () => {
      const { gift } = await api(`/couple/gifts/${g.id}`, { method: 'PUT', body: { isActive: !g.isActive } });
      setGifts(state.data.gifts.map((x) => (x.id === gift.id ? gift : x)));
    });

  const move = (index, delta) =>
    run(async () => {
      const ids = state.data.gifts.map((g) => g.id);
      const [id] = ids.splice(index, 1);
      ids.splice(index + delta, 0, id);
      const { gifts } = await api('/couple/gifts/order', { method: 'PUT', body: { ids } });
      setGifts(gifts);
    });

  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') return <LoadError error={state.error} retry={reload} />;
  const { gifts } = state.data;

  return (
    <div className="couple-stack">
      <div className="couple-toolbar">
        <p className="couple-muted">Reserved gifts disappear from the public wishlist automatically. Hidden gifts are never shown.</p>
        <button type="button" className="button button--small" onClick={() => setEditing('new')}>
          Add a gift
        </button>
      </div>
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      {!gifts.length && <p className="couple-card couple-muted">Your wishlist is empty. Add your first gift.</p>}
      <ol className="manage-list" data-testid="manage-gifts">
        {gifts.map((g, i) => (
          <li key={g.id} className="manage-item" data-testid="manage-gift">
            <div className="manage-item__thumb">{g.image ? <img src={g.image} alt="" loading="lazy" /> : null}</div>
            <div className="manage-item__info">
              <p className="manage-item__name">{g.name}</p>
              <p className="couple-muted">
                {giftsConfig.categories.find((c) => c.id === g.category)?.label} · {formatINR(g.estimatedPrice)}
              </p>
              <StatusBadge status={giftStatus(g)} />
              {g.reservation && <span className="couple-muted"> by {g.reservation.guestName}</span>}
            </div>
            <div className="manage-item__actions">
              <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${g.name} up`}>
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => move(i, 1)}
                disabled={i === gifts.length - 1}
                aria-label={`Move ${g.name} down`}
              >
                ↓
              </button>
              <button type="button" className="button button--ghost button--small" onClick={() => setEditing(g)}>
                Edit<span className="visually-hidden"> {g.name}</span>
              </button>
              <button type="button" className="button button--ghost button--small" onClick={() => toggle(g)}>
                {g.isActive ? 'Hide' : 'Show'}
                <span className="visually-hidden"> {g.name}</span>
              </button>
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => setDeleting(g)}
                disabled={Boolean(g.reservation)}
                title={g.reservation ? 'Release the reservation before deleting' : undefined}
              >
                Delete<span className="visually-hidden"> {g.name}</span>
              </button>
            </div>
          </li>
        ))}
      </ol>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} labelledBy="gift-editor-title" className="editor">
        {editing && (
          <GiftEditor
            gift={editing === 'new' ? null : editing}
            onSaved={(gift) => {
              const exists = gifts.some((x) => x.id === gift.id);
              setGifts(exists ? gifts.map((x) => (x.id === gift.id ? gift : x)) : [...gifts, gift]);
              setEditing(null);
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this gift?"
        body={deleting ? `“${deleting.name}” will be removed from your wishlist permanently.` : ''}
        confirmLabel="Delete gift"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await api(`/couple/gifts/${deleting.id}`, { method: 'DELETE' });
          setGifts(gifts.filter((x) => x.id !== deleting.id));
        }}
      />
    </div>
  );
}

function GiftEditor({ gift, onSaved }) {
  const [v, setV] = useState(() =>
    gift
      ? { ...gift, estimatedPrice: String(gift.estimatedPrice ?? ''), purchaseUrl: gift.purchaseUrl || '', image: gift.image || '' }
      : EMPTY,
  );
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFields({});
    const body = {
      name: v.name.trim(),
      description: v.description.trim(),
      image: v.image.trim(),
      estimatedPrice: v.estimatedPrice === '' ? 0 : Number(String(v.estimatedPrice).replace(/[^\d]/g, '')),
      purchaseUrl: v.purchaseUrl.trim(),
      category: v.category,
      isActive: v.isActive,
    };
    try {
      const { gift: saved } = await api(gift ? `/couple/gifts/${gift.id}` : '/couple/gifts', { method: gift ? 'PUT' : 'POST', body });
      onSaved(saved);
    } catch (err) {
      setBusy(false);
      setFields(err.fields || {});
      setError(err.message);
    }
  };

  return (
    <form className="editor__form" onSubmit={onSubmit} noValidate>
      <h2 id="gift-editor-title" className="couple-h2">
        {gift ? 'Edit gift' : 'Add a gift'}
      </h2>
      <TextField id="gift-name" label="Product name" value={v.name} onChange={set('name')} maxLength={120} error={fields.name} />
      <TextField
        id="gift-description"
        label="Short description"
        optional
        textarea
        rows={3}
        maxLength={600}
        value={v.description}
        onChange={set('description')}
        error={fields.description}
      />
      <ImageField id="gift-image" value={v.image} onChange={(image) => setV((s) => ({ ...s, image }))} error={fields.image} />
      <div className="editor__row">
        <TextField
          id="gift-price"
          label="Estimated price (₹)"
          inputMode="numeric"
          value={v.estimatedPrice}
          onChange={set('estimatedPrice')}
          error={fields.estimatedPrice}
        />
        <div className="field">
          <label className="label field__label" htmlFor="gift-category">
            Category
          </label>
          <select id="gift-category" className="field__input" value={v.category} onChange={set('category')}>
            {giftsConfig.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <TextField
        id="gift-url"
        label="Where to buy (link)"
        optional
        type="url"
        placeholder="https://"
        value={v.purchaseUrl}
        onChange={set('purchaseUrl')}
        error={fields.purchaseUrl}
      />
      <label className="toggle">
        <input type="checkbox" checked={v.isActive} onChange={set('isActive')} />
        <span>Show on the public wishlist</span>
      </label>
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button" disabled={busy}>
        {busy ? 'Saving…' : gift ? 'Save changes' : 'Add gift'}
      </button>
    </form>
  );
}
