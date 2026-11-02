import { useEffect, useRef, useState } from 'react';
import { events, rsvp, venue } from '../config.js';
import { Icon } from '../components/Icon.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { googleCalendarUrl } from '../lib/calendar.js';
import { petals } from '../lib/petals.js';
import { submitRsvp } from '../lib/rsvp.js';
import './Rsvp.css';

const STORAGE_KEY = 'rsvp-response';
const MESSAGE_MAX = 500;
const FIELD_ORDER = ['name', 'phone', 'attending', 'guests', 'events', 'message'];

function validate(v) {
  const errors = {};
  if (v.name.trim().length < 2) errors.name = 'Please enter your full name.';
  const digits = v.phone.replace(/\D/g, '');
  if (!digits) errors.phone = 'Please enter your phone number.';
  else if (digits.length < 10 || digits.length > 13) errors.phone = 'Please enter a valid 10-digit phone number.';
  if (!v.attending) errors.attending = 'Please let us know if you can make it.';
  if (v.attending === 'yes') {
    if (!(v.guests >= 1 && v.guests <= rsvp.maxGuests)) errors.guests = `Choose between 1 and ${rsvp.maxGuests} guests.`;
    if (!v.events.length) errors.events = 'Pick at least one celebration.';
  }
  if (v.message.length > MESSAGE_MAX) errors.message = `Please keep your message under ${MESSAGE_MAX} characters.`;
  return errors;
}

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function FieldError({ id, message }) {
  return (
    <p className="field__error" id={id} hidden={!message}>
      {message}
    </p>
  );
}

function Success({ values, onEdit }) {
  const headingRef = useRef(null);
  const first = values.name.trim().split(' ')[0];
  const coming = values.attending === 'yes';

  useEffect(() => {
    headingRef.current.focus();
    const rect = headingRef.current.getBoundingClientRect();
    petals.burst(rect.left + rect.width / 2, rect.top, coming ? 60 : 24);
  }, [coming]);

  return (
    <div className="rsvp__success" data-testid="rsvp-success">
      <svg className="rsvp__check" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="29" pathLength="1" />
        <path d="M19 33l9 9 17-19" pathLength="1" />
      </svg>
      <h3 ref={headingRef} tabIndex={-1} className="script rsvp__success-title">
        Thank you, {first}!
      </h3>
      <p className="rsvp__success-text">
        {coming
          ? `Your RSVP is in. We can't wait to celebrate with ${values.guests > 1 ? `your party of ${values.guests}` : 'you'} in ${venue.city.split(',')[0]}.`
          : "We'll miss you dearly, and we're grateful for your blessings from afar."}
      </p>
      <div className="button-row">
        {coming && (
          <a className="button" href={googleCalendarUrl()} target="_blank" rel="noopener noreferrer">
            <Icon name="calendar" />
            Add to calendar
          </a>
        )}
        <button type="button" className="button button--ghost" onClick={onEdit}>
          Edit my response
        </button>
      </div>
    </div>
  );
}

export function Rsvp({ guest }) {
  const [saved] = useState(readSaved);
  const [values, setValues] = useState(
    () => saved?.values ?? { name: guest, phone: '', attending: '', guests: 1, events: [], message: '' },
  );
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState(saved ? 'success' : 'idle');
  const [announce, setAnnounce] = useState('');
  const formRef = useRef(null);

  const errors = validate(values);
  const visibleError = (field) => (submitted || touched[field] ? errors[field] : undefined);

  const set = (field, value) => setValues((v) => ({ ...v, [field]: value }));
  const blur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const toggleEvent = (id) =>
    setValues((v) => ({ ...v, events: v.events.includes(id) ? v.events.filter((e) => e !== id) : [...v.events, id] }));

  const fieldProps = (field) => ({
    id: `rsvp-${field}`,
    'aria-invalid': visibleError(field) ? 'true' : undefined,
    'aria-describedby': visibleError(field) ? `rsvp-${field}-error` : undefined,
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const invalid = FIELD_ORDER.filter((f) => errors[f]);
    if (invalid.length) {
      setAnnounce(`Please check ${invalid.length === 1 ? 'one field' : `${invalid.length} fields`} before sending.`);
      formRef.current.querySelector(`[data-field="${invalid[0]}"]`)?.focus();
      return;
    }
    setAnnounce('Sending your RSVP…');
    setStatus('sending');
    try {
      await submitRsvp(values);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ values }));
      } catch {
        /* storage may be unavailable in private mode */
      }
      setAnnounce('');
      setStatus('success');
    } catch {
      setAnnounce('');
      setStatus('error');
    }
  };

  const attending = values.attending === 'yes';

  return (
    <section className="section tone-parchment rsvp" id="rsvp" aria-labelledby="rsvp-title">
      <div className="container container--narrow">
        <SectionHeading id="rsvp-title" eyebrow={`Kindly reply by ${rsvp.deadline}`} title="Will You Join Us?">
          Your presence is the greatest gift. Let us know so we can save you a seat.
        </SectionHeading>

        <Reveal className="rsvp__card">
          {status === 'success' ? (
            <Success values={values} onEdit={() => setStatus('idle')} />
          ) : (
            <form ref={formRef} className="rsvp__form" onSubmit={onSubmit} noValidate aria-busy={status === 'sending'}>
              <div className="field">
                <label className="label field__label" htmlFor="rsvp-name">
                  Full name <span aria-hidden="true">*</span>
                </label>
                <input
                  {...fieldProps('name')}
                  data-field="name"
                  className="field__input"
                  type="text"
                  autoComplete="name"
                  required
                  value={values.name}
                  onChange={(e) => set('name', e.target.value)}
                  onBlur={blur('name')}
                  placeholder="e.g. Priya Sharma"
                />
                <FieldError id="rsvp-name-error" message={visibleError('name')} />
              </div>

              <div className="field">
                <label className="label field__label" htmlFor="rsvp-phone">
                  Phone number <span aria-hidden="true">*</span>
                </label>
                <input
                  {...fieldProps('phone')}
                  data-field="phone"
                  className="field__input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={values.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  onBlur={blur('phone')}
                  placeholder="+91 98765 43210"
                />
                <FieldError id="rsvp-phone-error" message={visibleError('phone')} />
              </div>

              <fieldset className="field" aria-describedby={visibleError('attending') ? 'rsvp-attending-error' : undefined}>
                <legend className="label field__label">
                  Will you attend? <span aria-hidden="true">*</span>
                </legend>
                <div className="choices">
                  {[
                    ['yes', 'Joyfully accept', "Wouldn't miss it"],
                    ['no', 'Regretfully decline', 'Celebrating from afar'],
                  ].map(([value, title, sub], i) => (
                    <label key={value} className="choice">
                      <input
                        type="radio"
                        name="attending"
                        value={value}
                        data-field={i === 0 ? 'attending' : undefined}
                        checked={values.attending === value}
                        onChange={() => set('attending', value)}
                        onBlur={blur('attending')}
                        aria-invalid={visibleError('attending') ? 'true' : undefined}
                        required
                      />
                      <span className="choice__box">
                        <span className="choice__title">{title}</span>
                        <span className="choice__sub">{sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <FieldError id="rsvp-attending-error" message={visibleError('attending')} />
              </fieldset>

              {attending && (
                <div className="rsvp__extra">
                  <div className="field">
                    <label className="label field__label" htmlFor="rsvp-guests">
                      Guests, including you
                    </label>
                    <div className="stepper">
                      <button
                        type="button"
                        className="stepper__button"
                        onClick={() => set('guests', Math.max(1, values.guests - 1))}
                        disabled={values.guests <= 1}
                        aria-label="Remove a guest"
                      >
                        <Icon name="minus" />
                      </button>
                      <input
                        {...fieldProps('guests')}
                        data-field="guests"
                        className="stepper__input"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max={rsvp.maxGuests}
                        value={values.guests}
                        onChange={(e) => set('guests', Number(e.target.value))}
                        onBlur={blur('guests')}
                      />
                      <button
                        type="button"
                        className="stepper__button"
                        onClick={() => set('guests', Math.min(rsvp.maxGuests, values.guests + 1))}
                        disabled={values.guests >= rsvp.maxGuests}
                        aria-label="Add a guest"
                      >
                        <Icon name="plus" />
                      </button>
                    </div>
                    <FieldError id="rsvp-guests-error" message={visibleError('guests')} />
                  </div>

                  <fieldset className="field" aria-describedby={visibleError('events') ? 'rsvp-events-error' : undefined}>
                    <legend className="label field__label">
                      Which celebrations will you join? <span aria-hidden="true">*</span>
                    </legend>
                    <div className="checks">
                      {events.map((ev, i) => (
                        <label key={ev.id} className="check">
                          <input
                            type="checkbox"
                            name="events"
                            value={ev.id}
                            data-field={i === 0 ? 'events' : undefined}
                            checked={values.events.includes(ev.name)}
                            onChange={() => toggleEvent(ev.name)}
                            onBlur={blur('events')}
                            aria-invalid={visibleError('events') ? 'true' : undefined}
                          />
                          <span className="check__box">
                            <Icon name="check" className="check__mark" />
                            {ev.name}
                          </span>
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="rsvp__all"
                      onClick={() => set('events', values.events.length === events.length ? [] : events.map((ev) => ev.name))}
                    >
                      {values.events.length === events.length ? 'Clear selection' : 'Select all celebrations'}
                    </button>
                    <FieldError id="rsvp-events-error" message={visibleError('events')} />
                  </fieldset>
                </div>
              )}

              <div className="field">
                <label className="label field__label" htmlFor="rsvp-message">
                  A note for the couple <span className="field__optional">(optional)</span>
                </label>
                <textarea
                  {...fieldProps('message')}
                  data-field="message"
                  className="field__input field__textarea"
                  rows="3"
                  maxLength={MESSAGE_MAX + 50}
                  value={values.message}
                  onChange={(e) => set('message', e.target.value)}
                  onBlur={blur('message')}
                  placeholder="Blessings, song requests, dietary needs…"
                />
                <p className="field__count" aria-hidden="true">
                  {values.message.length}/{MESSAGE_MAX}
                </p>
                <FieldError id="rsvp-message-error" message={visibleError('message')} />
              </div>

              {status === 'error' && (
                <p className="rsvp__failure" role="alert">
                  Something went wrong while sending. Please check your connection and try again.
                </p>
              )}

              <button type="submit" className="button rsvp__submit" disabled={status === 'sending'}>
                {status === 'sending' ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Icon name="send" />
                    Send RSVP
                  </>
                )}
              </button>
              <p className="visually-hidden" role="status">
                {announce}
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
