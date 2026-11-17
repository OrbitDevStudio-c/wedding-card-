import { useCallback, useEffect, useState } from 'react';
import { Modal } from '../gifts/Modal.jsx';
import { useI18n } from '../i18n/index.jsx';
import { api } from '../lib/api.js';

// Loads a dashboard resource; signs the couple out if the server says the session has ended.
export function useResource(path, onAuthError) {
  const [state, setState] = useState({ status: 'loading', data: null });
  const load = useCallback(async () => {
    try {
      const data = await api(path);
      setState({ status: 'ready', data });
    } catch (error) {
      onAuthError?.(error);
      setState({ status: 'error', data: null, error });
    }
  }, [path, onAuthError]);
  useEffect(() => {
    load();
  }, [load]);
  return [state, load, setState];
}

export function Loading() {
  const { t } = useI18n();
  return (
    <p className="couple-muted" role="status">
      {t('couple.loading')}
    </p>
  );
}

export function LoadError({ error, retry }) {
  const { t } = useI18n();
  return (
    <div className="couple-card" role="alert">
      <p className="form-alert">{error?.message || 'Something went wrong.'}</p>
      <button type="button" className="button button--small" onClick={retry}>
        {t('couple.retry')}
      </button>
    </div>
  );
}

export function StatusBadge({ status }) {
  const { t } = useI18n();
  return <span className={`badge badge--${status}`}>{t(`status.${status}`)}</span>;
}

// Confirmation for anything destructive (release, delete).
export function ConfirmDialog({ open, title, body, confirmLabel, danger = true, onConfirm, onClose }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setBusy(false);
      setError('');
    }
  }, [open]);
  return (
    <Modal open={open} onClose={onClose} labelledBy="confirm-title" className="confirm">
      <div className="confirm__body">
        <h2 id="confirm-title" className="couple-h2">
          {title}
        </h2>
        <p>{body}</p>
        {error && (
          <p className="form-alert" role="alert">
            {error}
          </p>
        )}
        <div className="confirm__actions">
          <form method="dialog">
            <button className="button button--ghost button--small">{t('confirm.cancel')}</button>
          </form>
          <button
            type="button"
            className={`button button--small ${danger ? 'button--danger' : ''}`}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onClose();
              } catch (err) {
                setBusy(false);
                setError(err.message);
              }
            }}
          >
            {busy ? t('confirm.working') : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Image picker: uploads to the API (which re-encodes it) or accepts an https link.
export function ImageField({ id, value, onChange, error }) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setUploadError(t('image.tooBig'));
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const { url } = await api('/couple/uploads', { method: 'POST', formData: form });
      onChange(url);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };
  const shownError = uploadError || error;
  return (
    <div className="field">
      <span className="label field__label" id={`${id}-label`}>
        {t('image.label')} <span className="field__optional">{t('editor.optional')}</span>
      </span>
      <div className="image-field">
        <div className="image-field__preview">{value ? <img src={value} alt="" /> : <span aria-hidden="true">{t('image.none')}</span>}</div>
        <div className="image-field__controls">
          <label className="button button--ghost button--small image-field__upload">
            {uploading ? t('image.uploading') : t('image.upload')}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={onFile} disabled={uploading} className="visually-hidden" />
          </label>
          <label className="visually-hidden" htmlFor={id}>
            {t('image.link')}
          </label>
          <input
            id={id}
            className="field__input"
            placeholder={t('image.paste')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={shownError ? 'true' : undefined}
          />
        </div>
      </div>
      {shownError && <p className="field__error">{shownError}</p>}
    </div>
  );
}

export function TextField({ id, label, optional, error, textarea, ...props }) {
  const { t } = useI18n();
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className="field">
      <label className="label field__label" htmlFor={id}>
        {label} {optional && <span className="field__optional">{t('editor.optional')}</span>}
      </label>
      <Tag
        id={id}
        className={`field__input ${textarea ? 'field__textarea' : ''}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
