import { useState } from 'react';
import { couple } from '../config.js';
import { Monogram } from '../components/Monogram.jsx';
import { Lotus, LotusDivider } from '../components/Painted.jsx';
import { useI18n } from '../i18n/index.jsx';
import { api } from '../lib/api.js';

export function Login({ onSuccess }) {
  const { t, errorText } = useI18n();
  const [values, setValues] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!values.email.trim() || !values.password) {
      setError(t('login.missing'));
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await api('/auth/login', { method: 'POST', body: { email: values.email.trim(), password: values.password } });
      onSuccess();
    } catch (err) {
      setStatus('idle');
      setError(errorText(err));
    }
  };

  return (
    <main className="couple-login tone-dark">
      <form className="couple-login__card" onSubmit={onSubmit} noValidate>
        <Lotus className="couple-login__chhatris" />
        <Monogram className="couple-login__monogram" shimmer={false} label={false} />
        <h1 className="script couple-login__title">{t('login.welcome')}</h1>
        <p className="lede">{t('login.lede', { names: `${couple.bride.name} & ${couple.groom.name}` })}</p>
        <LotusDivider className="couple-login__ornament" />
        <div className="field">
          <label className="label field__label" htmlFor="login-email">
            {t('login.email')}
          </label>
          <input
            id="login-email"
            className="field__input"
            type="email"
            autoComplete="username"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          />
        </div>
        <div className="field">
          <label className="label field__label" htmlFor="login-password">
            {t('login.password')}
          </label>
          <input
            id="login-password"
            className="field__input"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          />
        </div>
        {error && (
          <p className="form-alert" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button" disabled={status === 'sending'}>
          {status === 'sending' ? t('login.sending') : t('login.submit')}
        </button>
      </form>
    </main>
  );
}
