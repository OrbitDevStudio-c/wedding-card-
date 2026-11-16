import { useCallback, useEffect, useRef, useState } from 'react';
import { couple, gifts as giftsConfig } from '../config.js';
import { Ornament } from '../components/Ornament.jsx';
import { api, formatINR } from '../lib/api.js';
import { petals } from '../lib/petals.js';
import { linkHandler, withGuest } from '../lib/router.js';
import { DreamProgress } from './Dreams.jsx';
import { WEDDING } from './GiftsPage.jsx';

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

// Razorpay Checkout loads only when a guest actually pays, never on page load.
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = RAZORPAY_SRC;
    s.async = true;
    s.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Razorpay failed to load')));
    s.onerror = () => reject(new Error('The payment window could not be loaded. Please check your connection.'));
    document.head.append(s);
  });
}

export function DreamPage({ slug, guest, wedding }) {
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

  useEffect(() => {
    if (state.dream) document.title = `${state.dream.title} · ${couple.bride.name} & ${couple.groom.name}`;
  }, [state.dream]);

  const back = withGuest('/gifts', guest);

  if (state.status === 'loading') return <div className="gifts-loading" role="status" aria-label="Loading this dream" />;
  if (state.status === 'error') {
    return (
      <section className="section tone-parchment gifts-message">
        <div className="container container--narrow">
          <h1 className="script gifts-message__title">{state.error.status === 404 ? 'Dream not found' : 'Something went wrong'}</h1>
          <p className="lede">{state.error.message}</p>
          <div className="button-row">
            <a className="button" href={`${back}#dreams`} onClick={linkHandler(`${back}#dreams`)}>
              See all dreams
            </a>
          </div>
        </div>
      </section>
    );
  }

  const { dream } = state;
  return (
    <>
      <section className="dream-hero tone-dark" aria-labelledby="dream-title">
        {dream.image && <img className="dream-hero__img" src={dream.image} alt="" width="1200" height="800" />}
        <div className="container container--narrow dream-hero__inner">
          <a className="dream-hero__back label" href={`${back}#dreams`} onClick={linkHandler(`${back}#dreams`)}>
            ← All dreams
          </a>
          <p className="label dream-hero__eyebrow">{giftsConfig.dreams.title}</p>
          <h1 id="dream-title" className="script dream-hero__title">
            {dream.title}
          </h1>
          <Ornament className="dream-hero__ornament" />
          {dream.description && <p className="lede dream-hero__desc">{dream.description}</p>}
          <DreamProgress dream={dream} />
        </div>
      </section>
      <section className="section tone-parchment" aria-labelledby="contribute-title">
        <div className="container container--narrow">
          <ContributeForm dream={dream} guest={guest} payments={wedding.payments} onPaid={load} />
        </div>
      </section>
    </>
  );
}

function ContributeForm({ dream, guest, payments, onPaid }) {
  const presets = giftsConfig.contributionPresets;
  const [values, setValues] = useState({ contributorName: guest || '', amount: String(presets[1] || ''), message: '', website: '' });
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | paying | verifying | success | demo | error
  const [error, setError] = useState('');
  const successRef = useRef(null);
  const demo = payments.mode !== 'razorpay';

  const amount = Number.parseInt(values.amount, 10);
  const errors = {};
  if (values.contributorName.trim().length < 2) errors.contributorName = 'Please enter your name.';
  if (!(amount >= payments.min && amount <= payments.max)) {
    errors.amount = `Choose an amount between ${formatINR(payments.min)} and ${formatINR(payments.max)}.`;
  }
  if (values.message.length > 500) errors.message = 'Please keep your message under 500 characters.';
  const shown = (f) => (submitted ? errors[f] : undefined);
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
    setError('');
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
          modal: { ondismiss: () => reject(Object.assign(new Error('Payment was cancelled. You have not been charged.'), { cancelled: true })) },
        });
        rzp.on('payment.failed', (resp) => reject(new Error(resp?.error?.description || 'The payment did not go through.')));
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
      setError(err.message);
    }
  };

  if (status === 'success' || status === 'demo') {
    return (
      <div className="contribute contribute--done" data-testid="contribute-success">
        <svg className="rsvp__check reserve__check" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="29" pathLength="1" />
          <path d="M19 33l9 9 17-19" pathLength="1" />
        </svg>
        <h2 id="contribute-title" ref={successRef} tabIndex={-1} className="script reserve__success-title">
          {status === 'demo' ? 'Thank you for your kindness!' : 'Thank you for this beautiful gift!'}
        </h2>
        {status === 'demo' ? (
          <p className="reserve__success-text">
            Your pledge of {formatINR(amount)} towards {dream.title} has been shared with the couple.{' '}
            <strong>This site is in demo mode, so no payment was taken.</strong>
          </p>
        ) : (
          <p className="reserve__success-text">
            Your contribution of {formatINR(amount)} towards {dream.title} has been received and verified. The couple will see your
            message.
          </p>
        )}
      </div>
    );
  }

  const busy = ['sending', 'paying', 'verifying'].includes(status);
  return (
    <form className="contribute rsvp__card" onSubmit={onSubmit} noValidate>
      <h2 id="contribute-title" className="script contribute__title">
        Contribute to this dream
      </h2>
      {demo && (
        <p className="contribute__demo" data-testid="demo-notice">
          <strong className="label">Demo mode</strong> Online payments are not switched on yet. Your pledge will be shared with the couple,
          but no money will be taken.
        </p>
      )}

      <div className="field">
        <label className="label field__label" htmlFor="contrib-contributorName">
          Your name
        </label>
        <input
          id="contrib-contributorName"
          className="field__input"
          autoComplete="name"
          maxLength={80}
          value={values.contributorName}
          onChange={set('contributorName')}
          aria-invalid={shown('contributorName') ? 'true' : undefined}
          aria-describedby={shown('contributorName') ? 'contrib-contributorName-error' : undefined}
        />
        <p className="field__error" id="contrib-contributorName-error" hidden={!shown('contributorName')}>
          {shown('contributorName')}
        </p>
      </div>

      <fieldset className="field">
        <legend className="label field__label">Amount</legend>
        <div className="chips contribute__presets">
          {presets.map((p) => (
            <button key={p} type="button" className="chip" aria-pressed={amount === p} onClick={() => setValues((v) => ({ ...v, amount: String(p) }))}>
              {formatINR(p)}
            </button>
          ))}
        </div>
        <label className="visually-hidden" htmlFor="contrib-amount">
          Amount in rupees
        </label>
        <div className="contribute__amount">
          <span aria-hidden="true">₹</span>
          <input
            id="contrib-amount"
            className="field__input"
            inputMode="numeric"
            placeholder="Other amount"
            value={values.amount}
            onChange={set('amount')}
            aria-invalid={shown('amount') ? 'true' : undefined}
            aria-describedby={shown('amount') ? 'contrib-amount-error' : undefined}
          />
        </div>
        <p className="field__error" id="contrib-amount-error" hidden={!shown('amount')}>
          {shown('amount')}
        </p>
      </fieldset>

      <div className="field">
        <label className="label field__label" htmlFor="contrib-message">
          A note for the couple <span className="field__optional">(optional)</span>
        </label>
        <textarea
          id="contrib-message"
          className="field__input field__textarea"
          rows={3}
          maxLength={550}
          value={values.message}
          onChange={set('message')}
          aria-invalid={shown('message') ? 'true' : undefined}
          aria-describedby={shown('message') ? 'contrib-message-error' : undefined}
        />
        <p className="field__error" id="contrib-message-error" hidden={!shown('message')}>
          {shown('message')}
        </p>
      </div>

      <div className="reserve__hp" aria-hidden="true">
        <label htmlFor="contrib-website">Website</label>
        <input id="contrib-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
      </div>

      {status === 'error' && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="button" disabled={busy} aria-busy={busy}>
        {status === 'verifying'
          ? 'Confirming your payment…'
          : busy
            ? 'Please wait…'
            : demo
              ? `Pledge ${Number.isFinite(amount) ? formatINR(amount) : ''}`
              : `Contribute ${Number.isFinite(amount) ? formatINR(amount) : ''}`}
      </button>
      {!demo && <p className="contribute__secure">Payments are processed securely by Razorpay. Card and UPI details never reach this site.</p>}
    </form>
  );
}
