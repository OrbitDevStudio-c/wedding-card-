import { useState } from 'react';
import { Modal } from '../gifts/Modal.jsx';
import { useI18n } from '../i18n/index.jsx';
import { api, formatINR } from '../lib/api.js';
import { QrCard } from './SharePanel.jsx';
import { ConfirmDialog, ImageField, LoadError, Loading, StatusBadge, TextField, useResource } from './shared.jsx';

const EMPTY = { title: '', slug: '', description: '', image: '', targetAmount: '', offlineAmount: '0', isActive: true, titleGu: '', descriptionGu: '' };

export function DreamsManager({ onAuthError }) {
  const { t } = useI18n();
  const [state, reload, setState] = useResource('/couple/dreams', onAuthError);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');

  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') return <LoadError error={state.error} retry={reload} />;
  const { dreams } = state.data;
  const setDreams = (list) => setState((s) => ({ ...s, data: { dreams: list } }));

  const toggle = async (d) => {
    setError('');
    try {
      const { dream } = await api(`/couple/dreams/${d.id}`, { method: 'PUT', body: { isActive: !d.isActive } });
      setDreams(dreams.map((x) => (x.id === dream.id ? dream : x)));
    } catch (err) {
      onAuthError(err);
      setError(err.message);
    }
  };

  return (
    <div className="couple-stack">
      <div className="couple-toolbar">
        <p className="couple-muted">{t('dreams.intro')}</p>
        <button type="button" className="button button--small" onClick={() => setEditing('new')}>
          {t('dreams.add')}
        </button>
      </div>
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      {!dreams.length && <p className="couple-card couple-muted">{t('dreams.empty')}</p>}
      <ul className="manage-list" data-testid="manage-dreams">
        {dreams.map((d) => (
          <li key={d.id} className="manage-item" data-testid="manage-dream">
            <div className="manage-item__thumb">{d.image ? <img src={d.image} alt="" loading="lazy" /> : null}</div>
            <div className="manage-item__info">
              <p className="manage-item__name">{d.title}</p>
              <p className="couple-muted">
                {t('dreams.summary', { raised: formatINR(d.raisedAmount), target: formatINR(d.targetAmount), pct: d.progress, n: d.contributions })}
              </p>
              <StatusBadge status={d.isActive ? 'available' : 'hidden'} />
              <span className="couple-muted"> /gifts/dream/{d.slug}</span>
            </div>
            <div className="manage-item__actions">
              <button type="button" className="button button--ghost button--small" onClick={() => setQr(d)}>
                {t('dreams.qr')}
                <span className="visually-hidden"> {t('dreams.qrFor', { title: d.title })}</span>
              </button>
              <button type="button" className="button button--ghost button--small" onClick={() => setEditing(d)}>
                {t('manage.edit')}
                <span className="visually-hidden"> {d.title}</span>
              </button>
              <button type="button" className="button button--ghost button--small" onClick={() => toggle(d)}>
                {d.isActive ? t('manage.hide') : t('manage.show')}
                <span className="visually-hidden"> {d.title}</span>
              </button>
              <button type="button" className="button button--ghost button--small" onClick={() => setDeleting(d)}>
                {t('manage.delete')}
                <span className="visually-hidden"> {d.title}</span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} labelledBy="dream-editor-title" className="editor">
        {editing && (
          <DreamEditor
            dream={editing === 'new' ? null : editing}
            onSaved={(dream) => {
              const exists = dreams.some((x) => x.id === dream.id);
              setDreams(exists ? dreams.map((x) => (x.id === dream.id ? dream : x)) : [...dreams, dream]);
              setEditing(null);
            }}
          />
        )}
      </Modal>

      <Modal open={Boolean(qr)} onClose={() => setQr(null)} labelledBy="qr-modal-title" className="editor">
        {qr && (
          <div className="editor__form">
            <h2 id="qr-modal-title" className="couple-h2">
              {qr.title}
            </h2>
            <QrCard title={qr.title} path={`/gifts/dream/${qr.slug}`} fileName={`dream-${qr.slug}`} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('dreams.deleteTitle')}
        body={deleting ? t('dreams.deleteBody', { title: deleting.title }) : ''}
        confirmLabel={t('dreams.delete')}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await api(`/couple/dreams/${deleting.id}`, { method: 'DELETE' });
          setDreams(dreams.filter((x) => x.id !== deleting.id));
        }}
      />
    </div>
  );
}

function DreamEditor({ dream, onSaved }) {
  const { t } = useI18n();
  const [v, setV] = useState(() =>
    dream
      ? {
          ...dream,
          targetAmount: String(dream.targetAmount),
          offlineAmount: String(dream.offlineAmount),
          titleGu: dream.translations?.gu?.title || '',
          descriptionGu: dream.translations?.gu?.description || '',
        }
      : EMPTY,
  );
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const num = (s) => (String(s).trim() === '' ? undefined : Number(String(s).replace(/[^\d]/g, '')));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFields({});
    const body = {
      title: v.title.trim(),
      slug: v.slug.trim() || undefined,
      description: v.description.trim(),
      image: v.image.trim(),
      targetAmount: num(v.targetAmount),
      offlineAmount: num(v.offlineAmount) ?? 0,
      isActive: v.isActive,
      translations: { gu: { title: v.titleGu.trim(), description: v.descriptionGu.trim() } },
    };
    try {
      const { dream: saved } = await api(dream ? `/couple/dreams/${dream.id}` : '/couple/dreams', { method: dream ? 'PUT' : 'POST', body });
      onSaved(saved);
    } catch (err) {
      setBusy(false);
      setFields(err.fields || {});
      setError(err.message);
    }
  };

  return (
    <form className="editor__form" onSubmit={onSubmit} noValidate>
      <h2 id="dream-editor-title" className="couple-h2">
        {dream ? t('dreamEditor.edit') : t('dreamEditor.add')}
      </h2>
      <TextField id="dream-title" label={t('dreamEditor.title')} value={v.title} onChange={set('title')} maxLength={120} error={fields.title} />
      <TextField
        id="dream-slug"
        label={t('dreamEditor.slug')}
        optional
        placeholder="switzerland-honeymoon"
        value={v.slug}
        onChange={set('slug')}
        maxLength={60}
        error={fields.slug}
      />
      {dream && v.slug !== dream.slug && (
        <p className="form-note">{t('dreamEditor.slugWarn')}</p>
      )}
      <TextField
        id="dream-description"
        label={t('dreamEditor.description')}
        optional
        textarea
        rows={3}
        maxLength={1000}
        value={v.description}
        onChange={set('description')}
        error={fields.description}
      />
      <ImageField id="dream-image" value={v.image} onChange={(image) => setV((s) => ({ ...s, image }))} error={fields.image} />
      <div className="editor__row">
        <TextField id="dream-target" label={t('dreamEditor.goal')} inputMode="numeric" value={v.targetAmount} onChange={set('targetAmount')} error={fields.targetAmount} />
        <TextField
          id="dream-offline"
          label={t('dreamEditor.offline')}
          inputMode="numeric"
          value={v.offlineAmount}
          onChange={set('offlineAmount')}
          error={fields.offlineAmount}
        />
      </div>
      <label className="toggle">
        <input type="checkbox" checked={v.isActive} onChange={set('isActive')} />
        <span>{t('dreamEditor.show')}</span>
      </label>
      <fieldset className="editor__translation" lang="gu">
        <legend className="label">{t('editor.gujarati')}</legend>
        <p className="couple-muted">{t('editor.gujaratiHint')}</p>
        <TextField id="dream-title-gu" label={t('editor.titleGu')} optional value={v.titleGu} onChange={set('titleGu')} maxLength={120} />
        <TextField
          id="dream-description-gu"
          label={t('editor.descriptionGu')}
          optional
          textarea
          rows={3}
          maxLength={1000}
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
        {busy ? t('editor.saving') : dream ? t('editor.save') : t('dreamEditor.save')}
      </button>
    </form>
  );
}
