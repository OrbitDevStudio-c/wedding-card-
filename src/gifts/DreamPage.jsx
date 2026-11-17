import { useCallback, useEffect, useRef, useState } from 'react';
import { couple } from '../config.js';
import { Ornament } from '../components/Ornament.jsx';
import { useI18n } from '../i18n/index.jsx';
import { api, formatINR } from '../lib/api.js';
import { petals } from '../lib/petals.js';
import { linkHandler, withGuest } from '../lib/router.js';
import { DreamProgress } from './Dreams.jsx';
import { WEDDING } from './GiftsPage.jsx';
import { LotusDivider } from '../components/Painted.jsx';

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

// Razorpay Checkout loads only when a guest actually pays, never on page load.
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = RAZORPAY_SRC;
    s.async = true;
    s.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(Object.assign(new Error('load'), { key: 'contribute.loadFailed' })));
    s.onerror = () => reject(Object.assign(new Error('load'), { key: 'contribute.loadFailed' }));
    document.head.append(s);
  });
}

export function DreamPage({ slug, guest, wedding }) {
  const { t, pick, errorText } = useI18n();
  const [state, setState] = useState({ status: 'loading' });

  const load = useCallback(async () => {
    try {
      const { dream } = await api(`${WEDDING}/dreams/${encodeURIComponent(slug)}`);
      setState({ status: 'ready', dream });
    } catch (error) {
      setState({ status: 'error', error });
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const title = state.dream ? pick(state.dream, 'title') : '';
  useEffect(() => {
    if (title) document.title = `${title} · ${couple.bride.name} & ${couple.groom.name}`;
  }, [title]);

  const back = withGuest('/gifts', guest);

  if (state.status === 'loading') return <div className="gifts-loading" role="status" aria-label={t('dream.loading')} />;
  if (state.status === 'error') {
    return (
      <section className="section tone-parchment gifts-message">
        <div className="container container--narrow">
          <h1 className="script gifts-message__title">{state.error.status === 404 ? t('dream.notFound') : t('dream.error')}</h1>
          <p className="lede">{state.error.status === 404 ? t('gifts.notFound') : errorText(state.error)}</p>
          <div className="button-row">
            <a className="button" href={`${back}#dreams`} onClick={linkHandler(`${back}#dreams`)}>
              {t('dream.seeAll')}
            </a>
          </div>
        </div>
      </section>
    );
  }

  const { dream } = state;
  const description = pick(dream, 'description');
  return (
    <>
      <section className="dream-hero tone-dark" aria-labelledby="dream-title">
        {dream.image && <img className="dream-hero__img" src={dream.image} alt="" width="1200" height="800" />}
        <div className="container container--narrow dream-hero__inner">
          <a className="dream-hero__back label" href={`${back}#dreams`} onClick={linkHandler(`${back}#dreams`)}>
            {t('dream.all')}
          </a>
          <p className="label dream-hero__eyebrow">{t('teaser.dreams')}</p>
          <h1 id="dream-title" className="script dream-hero__title">
            {title}
          </h1>
          <Ornament className="dream-hero__ornament" />
          {description && <p className="lede dream-hero__desc">{description}</p>}
          <DreamProgress dream={dream} />
        </div>
      </section>
      <section className="section tone-parchment dream-contribute" aria-labelledby="contribute-title">
        <div className="container container--narrow">
          <LotusDivider className="dream-contribute__divider" />
          <ContributeForm dream={dream} title={title} guest={guest} payments={wedding.payments} onPaid={load} />
        </div>
      </section>
    </>
  );
}

function ContributeForm({ dream, title, guest, payments, onPaid }) {
  const { t, content, errorText } = useI18n();
  const presets = content.gifts.contributionPresets;
  const [values, setValues] = useState({ contributorName: guest || '', amount: String(presets[1] || ''), message: '', website: '' });
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | paying | verifying | success | demo | error
  const [error, setError] = useState(null); // a translation key, or an API error
  const successRef = useRef(null);
  const demo = payments.mode !== 'razorpay';

  const amount = Number.parseInt(values.amount, 10);
  // Error keys, translated when shown, so they follow a language switch.
  const errors = {};
  if (values.contributorName.trim().length < 2) errors.contributorName = ['contribute.err.name'];
  if (!(amount >= payments.min && amount <= payments.max)) {
    errors.amount = ['contribute.err.amount', { min: formatINR(payments.min), max: formatINR(payments.max) }];
  }
  if (values.message.length > 500) errors.message = ['contribute.err.message'];
  const shown = (f) => (submitted && errors[f] ? t(errors[f][0], errors[f][1]) : undefined);
  const set = (f) => (e) => setValues((v) => ({ ...v, [f]: f === 'amount' ? e.target.value.replace(/\D/g, '').slice(0, 7) : e.target.value }));

  useEffect(() => {
    if (status !== 'success' && status !== 'demo') return;
    successRef.current?.focus();
    const r = successRef.current?.getBoundingClientRect();
    if (r && status === 'success') petals.burst(r.left + r.width / 2, r.top, 60);
  }, [status]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      document.getElementById(`contrib-${Object.keys(errors)[0]}`)?.focus();
      return;
    }
    setStatus('sending');
    setError(null);
    try {
      const order = await api(`${WEDDING}/dreams/${dream.slug}/contributions`, {
        method: 'POST',
        body: { contributorName: values.contributorName.trim(), amount, message: values.message.trim(), website: values.website },
      });
      if (order.mode === 'demo') {
        setStatus('demo');
        return;
      }
      const Razorpay = await loadRazorpay();
      setStatus('paying');
      // The contribution only counts once the server verifies Razorpay's signature.
      const result = await new Promise((resolve, reject) => {
        const rzp = new Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: order.name,
          description: order.description,
          prefill: { name: values.contributorName.trim() },
          theme: { color: '#0f3b35' },
          handler: resolve,
          modal: { ondismiss: () => reject(Object.assign(new Error('cancelled'), { key: 'contribute.cancelled' })) },
        });
        rzp.on('payment.failed', () => reject(Object.assign(new Error('failed'), { key: 'contribute.failed' })));
        rzp.open();
      });
      setStatus('verifying');
      await api(`${WEDDING}/contributions/verify`, {
        method: 'POST',
        body: { orderId: result.razorpay_order_id, paymentId: result.razorpay_payment_id, signature: result.razorpay_signature },
      });
      setStatus('success');
      onPaid();
    } catch (err) {
      setStatus('error');
      setError(err);
    }
  };

  const formatted = Number.isFinite(amount) ? formatINR(amount) : '';

  if (status === 'success' || status === 'demo') {
    return (
      <div className="contribute contribute--done" data-testid="contribute-success">
        <svg className="rsvp__check reserve__check" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="29" pathLength="1" />
          <path d="M19 33l9 9 17-19" pathLength="1" />
        </svg>
        <h2 id="contribute-title" ref={successRef} tabIndex={-1} className="script reserve__success-title">
          {status === 'demo' ? t('contribute.thanksDemo') : t('contribute.thanks')}
        </h2>
        {status === 'demo' ? (
          <p className="reserve__success-text">
            {t('contribute.doneDemo', { amount: formatted, title })} <strong>{t('contribute.demoNote')}</strong>
          </p>
        ) : (
          <p className="reserve__success-text">{t('contribute.done', { amount: formatted, title })}</p>
        )}
      </div>
    );
  }

  const busy = ['sending', 'paying', 'verifying'].includes(status);
  const fieldAria = (f) => ({
    'aria-invalid': shown(f) ? 'true' : undefined,
    'aria-describedby': shown(f) ? `contrib-${f}-error` : undefined,
  });
  return (
    <form className="contribute rsvp__card royal-frame" onSubmit={onSubmit} noValidate>
      <h2 id="contribute-title" className="script contribute__title">
        {t('contribute.title')}
      </h2>
      {demo && (
        <p className="contribute__demo" data-testid="demo-notice">
          <strong className="label">{t('contribute.demoLabel')}</strong> {t('contribute.demo')}
        </p>
      )}

      <div className="field">
        <label className="label field__label" htmlFor="contrib-contributorName">
          {t('contribute.name')}
        </label>
        <input
          id="contrib-contributorName"
          className="field__input"
          autoComplete="name"
          maxLength={80}
          value={values.contributorName}
          onChange={set('contributorName')}
          {...fieldAria('contributorName')}
        />
        <p className="field__error" id="contrib-contributorName-error" hidden={!shown('contributorName')}>
          {shown('contributorName')}
        </p>
      </div>

      <fieldset className="field">
        <legend className="label field__label">{t('contribute.amount')}</legend>
        <div className="chips contribute__presets">
          {presets.map((p) => (
            <button key={p} type="button" className="chip" aria-pressed={amount === p} onClick={() => setValues((v) => ({ ...v, amount: String(p) }))}>
              {formatINR(p)}
            </button>
          ))}
        </div>
        <label className="visually-hidden" htmlFor="contrib-amount">
          {t('contribute.amountLabel')}
        </label>
        <div className="contribute__amount">
          <span aria-hidden="true">₹</span>
          <input
            id="contrib-amount"
            className="field__input"
            inputMode="numeric"
            placeholder={t('contribute.other')}
            value={values.amount}
            onChange={set('amount')}
            {...fieldAria('amount')}
          />
        </div>
        <p className="field__error" id="contrib-amount-error" hidden={!shown('amount')}>
          {shown('amount')}
        </p>
      </fieldset>

      <div className="field">
        <label className="label field__label" htmlFor="contrib-message">
          {t('contribute.note')} <span className="field__optional">{t('reserve.optional')}</span>
        </label>
        <textarea
          id="contrib-message"
          className="field__input field__textarea"
          rows={3}
          maxLength={550}
          value={values.message}
          onChange={set('message')}
          {...fieldAria('message')}
        />
        <p className="field__error" id="contrib-message-error" hidden={!shown('message')}>
          {shown('message')}
        </p>
      </div>

      <div className="reserve__hp" aria-hidden="true">
        <label htmlFor="contrib-website">Website</label>
        <input id="contrib-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
      </div>

      {status === 'error' && error && (
        <p className="form-alert" role="alert">
          {error.key ? t(error.key) : errorText(error)}
        </p>
      )}

      <button type="submit" className="button" disabled={busy} aria-busy={busy}>
        {status === 'verifying'
          ? t('contribute.verifying')
          : busy
            ? t('contribute.wait')
            : demo
              ? t('contribute.pledge', { amount: formatted })
              : t('contribute.pay', { amount: formatted })}
      </button>
      {!demo && <p className="contribute__secure">{t('contribute.secure')}</p>}
    </form>
  );
}
