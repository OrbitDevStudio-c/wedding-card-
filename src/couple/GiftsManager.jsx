import { useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { Modal } from '../gifts/Modal.jsx';
import { api, formatINR } from '../lib/api.js';
import { ConfirmDialog, ImageField, LoadError, Loading, StatusBadge, TextField, useResource } from './shared.jsx';

const EMPTY = { name: '', description: '', image: '', estimatedPrice: '', purchaseUrl: '', category: 'other', isActive: true, nameGu: '', descriptionGu: '' };

const giftStatus = (g) => (g.reservation ? g.reservation.status : g.isActive ? 'available' : 'hidden');

export function GiftsManager({ onAuthError }) {
  const { t, content } = useI18n();
  const giftsConfig = content.gifts;
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
        <p className="couple-muted">{t('manage.giftsIntro')}</p>
        <button type="button" className="button button--small" onClick={() => setEditing('new')}>
          {t('manage.addGift')}
        </button>
      </div>
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      {!gifts.length && <p className="couple-card couple-muted">{t('manage.emptyGifts')}</p>}
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
              {g.reservation && <span className="couple-muted"> {t('manage.by', { guest: g.reservation.guestName })}</span>}
            </div>
            <div className="manage-item__actions">
              <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('manage.up', { name: g.name })}>
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => move(i, 1)}
                disabled={i === gifts.length - 1}
                aria-label={t('manage.down', { name: g.name })}
              >
                ↓
              </button>
              <button type="button" className="button button--ghost button--small" onClick={() => setEditing(g)}>
                {t('manage.edit')}
                <span className="visually-hidden"> {g.name}</span>
              </button>
              <button type="button" className="button button--ghost button--small" onClick={() => toggle(g)}>
                {g.isActive ? t('manage.hide') : t('manage.show')}
                <span className="visually-hidden"> {g.name}</span>
              </button>
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => setDeleting(g)}
                disabled={Boolean(g.reservation)}
                title={g.reservation ? t('manage.releaseFirst') : undefined}
              >
                {t('manage.delete')}
                <span className="visually-hidden"> {g.name}</span>
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
        title={t('manage.deleteGiftTitle')}
        body={deleting ? t('manage.deleteGiftBody', { name: deleting.name }) : ''}
        confirmLabel={t('manage.deleteGift')}
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
  const { t, content } = useI18n();
  const giftsConfig = content.gifts;
  const [v, setV] = useState(() =>
    gift
      ? {
          ...gift,
          estimatedPrice: String(gift.estimatedPrice ?? ''),
          purchaseUrl: gift.purchaseUrl || '',
          image: gift.image || '',
          nameGu: gift.translations?.gu?.name || '',
          descriptionGu: gift.translations?.gu?.description || '',
        }
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
      translations: { gu: { name: v.nameGu.trim(), description: v.descriptionGu.trim() } },
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
        {gift ? t('editor.editGift') : t('editor.addGift')}
      </h2>
      <TextField id="gift-name" label={t('editor.name')} value={v.name} onChange={set('name')} maxLength={120} error={fields.name} />
      <TextField
        id="gift-description"
        label={t('editor.description')}
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
          label={t('editor.price')}
          inputMode="numeric"
          value={v.estimatedPrice}
          onChange={set('estimatedPrice')}
          error={fields.estimatedPrice}
        />
        <div className="field">
          <label className="label field__label" htmlFor="gift-category">
            {t('editor.category')}
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
        label={t('editor.url')}
        optional
        type="url"
        placeholder="https://"
        value={v.purchaseUrl}
        onChange={set('purchaseUrl')}
        error={fields.purchaseUrl}
      />
      <label className="toggle">
        <input type="checkbox" checked={v.isActive} onChange={set('isActive')} />
        <span>{t('editor.showGift')}</span>
      </label>
      <fieldset className="editor__translation" lang="gu">
        <legend className="label">{t('editor.gujarati')}</legend>
        <p className="couple-muted">{t('editor.gujaratiHint')}</p>
        <TextField id="gift-name-gu" label={t('editor.nameGu')} optional value={v.nameGu} onChange={set('nameGu')} maxLength={120} />
        <TextField
          id="gift-description-gu"
          label={t('editor.descriptionGu')}
          optional
          textarea
          rows={3}
          maxLength={600}
          value={v.descriptionGu}
          onChange={set('descriptionGu')}
          error={fields.translations}
        />
      </fieldset>
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button" disabled={busy}>
        {busy ? t('editor.saving') : gift ? t('editor.save') : t('editor.add')}
      </button>
    </form>
  );
}
