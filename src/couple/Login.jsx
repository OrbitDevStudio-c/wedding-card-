import { useState } from 'react';
import { couple } from '../config.js';
import { Monogram } from '../components/Monogram.jsx';
import { Ornament } from '../components/Ornament.jsx';
import { api } from '../lib/api.js';

export function Login({ onSuccess }) {
  const [values, setValues] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!values.email.trim() || !values.password) {
      setError('Please enter your email and password.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await api('/auth/login', { method: 'POST', body: { email: values.email.trim(), password: values.password } });
      onSuccess();
    } catch (err) {
      setStatus('idle');
      setError(err.message);
    }
  };

  return (
    <main className="couple-login tone-dark">
      <form className="couple-login__card" onSubmit={onSubmit} noValidate>
        <Monogram className="couple-login__monogram" shimmer={false} label={false} />
        <h1 className="script couple-login__title">Welcome back</h1>
        <p className="lede">
          The private gift dashboard for {couple.bride.name} &amp; {couple.groom.name}.
        </p>
        <Ornament className="couple-login__ornament" />
        <div className="field">
          <label className="label field__label" htmlFor="login-email">
            Email
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
            Password
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
          {status === 'sending' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
