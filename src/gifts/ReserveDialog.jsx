import { useEffect, useRef, useState } from 'react';
import { gifts as giftsConfig } from '../config.js';
import { api, formatINR } from '../lib/api.js';
import { petals } from '../lib/petals.js';
import { WEDDING } from './GiftsPage.jsx';
import { Modal } from './Modal.jsx';

const MESSAGE_MAX = 500;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

function validate(v) {
  const errors = {};
  if (v.guestName.trim().length < 2) errors.guestName = 'Please enter your name.';
  if (v.guestPhone.trim() && !PHONE_RE.test(v.guestPhone.trim())) errors.guestPhone = 'Please enter a valid phone number.';
  if (v.message.length > MESSAGE_MAX) errors.message = `Please keep your message under ${MESSAGE_MAX} characters.`;
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
  const [values, setValues] = useState({ guestName: guest || '', guestPhone: '', message: '', website: '' });
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | success | taken | error
  const [serverError, setServerError] = useState('');
  const [serverFields, setServerFields] = useState({});
  const formRef = useRef(null);
  const successRef = useRef(null);

  const errors = { ...validate(values), ...serverFields };
  const shown = (f) => (submitted ? errors[f] : undefined);
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
    const clientErrors = validate(values);
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
        setServerError(err.message);
        onReserved();
      } else {
        setStatus('error');
        setServerFields(err.fields || {});
        setServerError(err.message);
      }
    }
  };

  const { reservation } = giftsConfig;

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
          <span className="label">Your gift</span>
          {gift.name}
        </p>
        <div className="button-row">
          {gift.purchaseUrl && (
            <a className="button" href={gift.purchaseUrl} target="_blank" rel="noopener noreferrer nofollow">
              Shop for this gift<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          )}
          <form method="dialog">
            <button className="button button--ghost">Back to the wishlist</button>
          </form>
        </div>
      </div>
    );
  }

  if (status === 'taken') {
    return (
      <div className="reserve__success" role="alert">
        <h2 id="reserve-title" className="script reserve__success-title">
          Just missed it
        </h2>
        <p className="reserve__success-text">{serverError}</p>
        <form method="dialog" className="button-row">
          <button className="button">Choose another gift</button>
        </form>
      </div>
    );
  }

  return (
    <form ref={formRef} className="reserve__form" onSubmit={onSubmit} noValidate>
      <div className="reserve__gift">
        {gift.image && <img src={gift.image} alt="" width="96" height="96" />}
        <div>
          <p className="label reserve__eyebrow">Reserve this gift</p>
          <h2 id="reserve-title" className="reserve__title">
            {gift.name}
          </h2>
          {gift.estimatedPrice > 0 && <p className="reserve__price">Approx. {formatINR(gift.estimatedPrice)}</p>}
        </div>
      </div>

      <div className="field">
        <label className="label field__label" htmlFor="reserve-guestName">
          Your name
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
          Phone <span className="field__optional">(optional)</span>
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
          A note for the couple <span className="field__optional">(optional)</span>
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
        {status === 'sending' ? 'Reserving…' : 'Confirm Gift Reservation'}
      </button>
    </form>
  );
}
