import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { api, formatINR } from '../lib/api.js';
import { petals } from '../lib/petals.js';
import { LotusDivider } from '../components/Painted.jsx';
import { WEDDING } from './GiftsPage.jsx';
import { Modal } from './Modal.jsx';

const MESSAGE_MAX = 500;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

// Errors are message keys, translated when shown, so they follow a language switch.
function validate(v) {
  const errors = {};
  if (v.guestName.trim().length < 2) errors.guestName = 'reserve.err.name';
  if (v.guestPhone.trim() && !PHONE_RE.test(v.guestPhone.trim())) errors.guestPhone = 'reserve.err.phone';
  if (v.message.length > MESSAGE_MAX) errors.message = 'reserve.err.message';
  return errors;
}

export function ReserveDialog({ gift, guest, onClose, onReserved }) {
  // Keep the last gift while the dialog animates closed.
  const [current, setCurrent] = useState(gift);
  useEffect(() => {
    if (gift) setCurrent(gift);
  }, [gift]);

  return (
    <Modal open={Boolean(gift)} onClose={onClose} labelledBy="reserve-title" className="reserve">
      {current && <ReserveForm key={current.id} gift={current} guest={guest} onReserved={onReserved} />}
    </Modal>
  );
}

function ReserveForm({ gift, guest, onReserved }) {
  const { t, pick, content, errorText } = useI18n();
  const name = pick(gift, 'name');
  const [values, setValues] = useState({ guestName: guest || '', guestPhone: '', message: '', website: '' });
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | success | taken | error
  const [serverError, setServerError] = useState('');
  const [serverFields, setServerFields] = useState({});
  const formRef = useRef(null);
  const successRef = useRef(null);

  const clientErrors = validate(values);
  // Client errors are keys; errors the server returned for a field are shown as sent.
  const shown = (f) => {
    if (!submitted) return undefined;
    if (clientErrors[f]) return t(clientErrors[f], { max: MESSAGE_MAX });
    return serverFields[f];
  };
  const set = (f) => (e) => {
    setValues((v) => ({ ...v, [f]: e.target.value }));
    // Drop the server's error for this field (deleting, not setting undefined, so the
    // client-side error for the same field is not masked when the two are merged).
    setServerFields(({ [f]: _dropped, ...rest }) => rest);
  };
  const fieldProps = (f) => ({
    id: `reserve-${f}`,
    'aria-invalid': shown(f) ? 'true' : undefined,
    'aria-describedby': shown(f) ? `reserve-${f}-error` : undefined,
  });

  useEffect(() => {
    if (status !== 'success') return;
    successRef.current?.focus();
    const r = successRef.current?.getBoundingClientRect();
    if (r) petals.burst(r.left + r.width / 2, r.top, 50);
  }, [status]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const first = ['guestName', 'guestPhone', 'message'].find((f) => clientErrors[f]);
    if (first) {
      formRef.current.querySelector(`#reserve-${first}`)?.focus();
      return;
    }
    setStatus('sending');
    setServerError('');
    try {
      await api(`${WEDDING}/gifts/${gift.id}/reservations`, {
        method: 'POST',
        body: {
          guestName: values.guestName.trim(),
          guestPhone: values.guestPhone.trim() || undefined,
          message: values.message.trim(),
          website: values.website,
        },
      });
      setStatus('success');
      onReserved();
    } catch (err) {
      if (err.code === 'already_reserved' || err.code === 'unavailable' || err.status === 404) {
        setStatus('taken');
        setServerError(t(err.code === 'already_reserved' ? 'reserve.taken' : 'reserve.unavailable'));
        onReserved();
      } else {
        setStatus('error');
        setServerFields(err.fields || {});
        setServerError(errorText(err));
      }
    }
  };

  const { reservation } = content.gifts;

  if (status === 'success') {
    return (
      <div className="reserve__success" data-testid="reserve-success">
        <svg className="rsvp__check reserve__check" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="29" pathLength="1" />
          <path d="M19 33l9 9 17-19" pathLength="1" />
        </svg>
        <h2 id="reserve-title" ref={successRef} tabIndex={-1} className="script reserve__success-title">
          {reservation.successTitle}
        </h2>
        <p className="reserve__success-text">{reservation.successText}</p>
        <p className="reserve__gift-name">
          <span className="label">{t('reserve.yourGift')}</span>
          {name}
        </p>
        <div className="button-row">
          {gift.purchaseUrl && (
            <a className="button" href={gift.purchaseUrl} target="_blank" rel="noopener noreferrer nofollow">
              {t('reserve.shop')}
              <span className="visually-hidden"> {t('common.newTab')}</span>
            </a>
          )}
          <form method="dialog">
            <button className="button button--ghost">{t('reserve.back')}</button>
          </form>
        </div>
      </div>
    );
  }

  if (status === 'taken') {
    return (
      <div className="reserve__success" role="alert">
        <h2 id="reserve-title" className="script reserve__success-title">
          {t('reserve.takenTitle')}
        </h2>
        <p className="reserve__success-text">{serverError}</p>
        <form method="dialog" className="button-row">
          <button className="button">{t('reserve.chooseAnother')}</button>
        </form>
      </div>
    );
  }

  return (
    <form ref={formRef} className="reserve__form" onSubmit={onSubmit} noValidate>
      <LotusDivider className="reserve__divider" />
      <div className="reserve__gift">
        {gift.image && <img src={gift.image} alt="" width="96" height="96" />}
        <div>
          <p className="label reserve__eyebrow">{t('reserve.eyebrow')}</p>
          <h2 id="reserve-title" className="reserve__title">
            {name}
          </h2>
          {gift.estimatedPrice > 0 && (
            <p className="reserve__price">
              {t('gift.approx')} {formatINR(gift.estimatedPrice)}
            </p>
          )}
        </div>
      </div>

      <div className="field">
        <label className="label field__label" htmlFor="reserve-guestName">
          {t('reserve.name')}
        </label>
        <input
          {...fieldProps('guestName')}
          className="field__input"
          type="text"
          autoComplete="name"
          maxLength={80}
          value={values.guestName}
          onChange={set('guestName')}
          required
        />
        <p className="field__error" id="reserve-guestName-error" hidden={!shown('guestName')}>
          {shown('guestName')}
        </p>
      </div>

      <div className="field">
        <label className="label field__label" htmlFor="reserve-guestPhone">
          {t('reserve.phone')} <span className="field__optional">{t('reserve.optional')}</span>
        </label>
        <input
          {...fieldProps('guestPhone')}
          className="field__input"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          value={values.guestPhone}
          onChange={set('guestPhone')}
        />
        <p className="field__error" id="reserve-guestPhone-error" hidden={!shown('guestPhone')}>
          {shown('guestPhone')}
        </p>
      </div>

      <div className="field">
        <label className="label field__label" htmlFor="reserve-message">
          {t('reserve.note')} <span className="field__optional">{t('reserve.optional')}</span>
        </label>
        <textarea
          {...fieldProps('message')}
          className="field__input field__textarea"
          rows={3}
          maxLength={MESSAGE_MAX + 50}
          value={values.message}
          onChange={set('message')}
        />
        <p className="field__error" id="reserve-message-error" hidden={!shown('message')}>
          {shown('message')}
        </p>
      </div>

      {/* Honeypot: hidden from people and assistive tech, filled in by bots */}
      <div className="reserve__hp" aria-hidden="true">
        <label htmlFor="reserve-website">Website</label>
        <input id="reserve-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
      </div>

      <p className="reserve__privacy">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        {reservation.privacyNotice}
      </p>

      {status === 'error' && serverError && (
        <p className="form-alert" role="alert">
          {serverError}
        </p>
      )}

      <button type="submit" className="button reserve__submit" disabled={status === 'sending'} aria-busy={status === 'sending'}>
        {status === 'sending' ? t('reserve.sending') : t('reserve.submit')}
      </button>
    </form>
  );
}
