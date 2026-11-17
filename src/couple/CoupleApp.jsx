import { useCallback, useEffect, useState } from 'react';
import { couple } from '../config.js';
import { Monogram } from '../components/Monogram.jsx';
import { useI18n } from '../i18n/index.jsx';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher.jsx';
import { api } from '../lib/api.js';
import { linkHandler, navigate } from '../lib/router.js';
import { Contributions } from './Contributions.jsx';
import { DreamsManager } from './DreamsManager.jsx';
import { GiftsManager } from './GiftsManager.jsx';
import { Login } from './Login.jsx';
import { Overview } from './Overview.jsx';
import { Reservations } from './Reservations.jsx';
import { SharePanel } from './SharePanel.jsx';
import '../sections/Rsvp.css';
import '../styles/ui.css';
import './couple.css';

const TABS = [
  { id: 'overview', Panel: Overview },
  { id: 'wishlist', Panel: GiftsManager },
  { id: 'reservations', Panel: Reservations },
  { id: 'dreams', Panel: DreamsManager },
  { id: 'contributions', Panel: Contributions },
  { id: 'share', Panel: SharePanel },
];

// Access is decided by the server on every request (HttpOnly session cookie + wedding ownership).
// This component only asks the server who is signed in; hiding UI is never the protection.
export default function CoupleApp({ path }) {
  const { t } = useI18n();
  const [session, setSession] = useState({ status: 'loading' });

  const refresh = useCallback(async () => {
    try {
      const me = await api('/couple/me');
      setSession({ status: 'in', me });
    } catch (err) {
      setSession({ status: err.status === 401 ? 'out' : 'error', error: err });
    }
  }, []);

  useEffect(() => {
    document.title = `${t('couple.title')} · ${couple.bride.name} & ${couple.groom.name}`;
    document.body.classList.remove('is-locked');
    // Keep private pages out of search engines.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.append(meta);
    refresh();
    return () => meta.remove();
  }, [refresh, t]);

  const onLogin = path === '/couple/login';
  // Stable identity: panels depend on it, so a new function each render would refetch forever.
  const onAuthError = useCallback((err) => {
    if (err?.status === 401) setSession({ status: 'out' });
  }, []);

  useEffect(() => {
    if (session.status === 'in' && (onLogin || path === '/couple')) navigate('/couple/dashboard', { replace: true });
    if (session.status === 'out' && !onLogin) navigate('/couple/login', { replace: true });
  }, [session.status, onLogin, path]);

  if (session.status === 'loading') return <div className="page-loading" role="status" aria-label={t('couple.loading')} />;
  if (session.status === 'error') {
    return (
      <main className="couple-login">
        <div className="couple-login__card">
          <p className="form-alert" role="alert">
            {session.error.message}
          </p>
          <button type="button" className="button" onClick={refresh}>
            {t('couple.retry')}
          </button>
        </div>
      </main>
    );
  }
  if (session.status === 'out') return <Login onSuccess={refresh} />;

  const tabId = path.match(/^\/couple\/dashboard\/([a-z]+)/)?.[1] || 'overview';
  const tab = TABS.find((x) => x.id === tabId) || TABS[0];
  const signOut = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setSession({ status: 'out' });
    navigate('/couple/login', { replace: true });
  };

  return (
    <div className="couple">
      <a className="skip-link" href="#couple-main">
        {t('gifts.skip')}
      </a>
      <header className="couple-bar tone-dark">
        <div className="couple-bar__brand">
          <Monogram className="couple-bar__monogram" shimmer={false} label={false} />
          <div>
            <p className="label">{t('couple.title')}</p>
            <p className="couple-bar__names">{session.me.wedding.coupleNames}</p>
          </div>
        </div>
        <div className="couple-bar__actions">
          <LanguageSwitcher tone="dark" />
          <a className="couple-bar__link" href="/gifts" target="_blank" rel="noopener">
            {t('couple.viewGifts')}
            <span className="visually-hidden"> {t('common.newTab')}</span>
          </a>
          <button type="button" className="couple-bar__link" onClick={signOut}>
            {t('couple.signOut')}
          </button>
        </div>
      </header>
      <nav className="couple-tabs" aria-label={t('couple.nav')}>
        <ul>
          {TABS.map((tab_) => {
            const href = tab_.id === 'overview' ? '/couple/dashboard' : `/couple/dashboard/${tab_.id}`;
            return (
              <li key={tab_.id}>
                <a href={href} onClick={linkHandler(href)} aria-current={tab_.id === tab.id ? 'page' : undefined}>
                  {t(`couple.tab.${tab_.id}`)}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <main id="couple-main" className="couple-main container">
        <h1 className="couple-main__title">{t(`couple.tab.${tab.id}`)}</h1>
        <tab.Panel me={session.me} onAuthError={onAuthError} />
      </main>
    </div>
  );
}
