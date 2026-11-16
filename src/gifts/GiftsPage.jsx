import { useEffect, useState } from 'react';
import { couple, gifts } from '../config.js';
import { Monogram } from '../components/Monogram.jsx';
import { Footer } from '../sections/Footer.jsx';
import { useGuestName } from '../hooks/useGuestName.js';
import { api } from '../lib/api.js';
import { linkHandler, withGuest } from '../lib/router.js';
import { DreamPage } from './DreamPage.jsx';
import { Dreams } from './Dreams.jsx';
import { GiftsHero } from './GiftsHero.jsx';
import { Wishlist } from './Wishlist.jsx';
import '../sections/Rsvp.css';
import '../styles/ui.css';
import './gifts.css';

export const WEDDING = `/weddings/${gifts.weddingSlug}`;

// Wedding settings from the API (whether gifts/dreams are switched on, payment mode).
export function useWedding() {
  const [state, setState] = useState({ status: 'loading', wedding: null });
  useEffect(() => {
    const ctrl = new AbortController();
    api(WEDDING, { signal: ctrl.signal })
      .then((wedding) => setState({ status: 'ready', wedding }))
      .catch((err) => err.name !== 'AbortError' && setState({ status: 'error', error: err }));
    return () => ctrl.abort();
  }, []);
  return state;
}

function TopBar({ guest }) {
  const home = withGuest('/', guest);
  const gifts = withGuest('/gifts', guest);
  return (
    <header className="gifts-bar tone-dark">
      <a className="gifts-bar__brand" href={gifts} onClick={linkHandler(gifts)}>
        <Monogram className="gifts-bar__monogram" shimmer={false} label={false} />
        <span className="label">Wedding Gifts</span>
      </a>
      <a className="gifts-bar__back" href={home} onClick={linkHandler(home)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        <span>
          Back <span className="gifts-bar__long">to the invitation</span>
        </span>
      </a>
    </header>
  );
}

export default function GiftsPage({ path }) {
  const guest = useGuestName();
  const { status, wedding, error } = useWedding();
  const dreamSlug = path.match(/^\/gifts\/dream\/([^/]+)$/)?.[1];
  const known = path === '/gifts' || Boolean(dreamSlug);

  useEffect(() => {
    document.title = `Wedding Gifts · ${couple.bride.name} & ${couple.groom.name}`;
    document.body.classList.remove('is-locked');
  }, []);

  let content;
  if (!known) content = <NotFound guest={guest} />;
  else if (status === 'loading') content = <div className="gifts-loading" role="status" aria-label="Loading the gift page" />;
  else if (status === 'error' || !wedding?.giftsEnabled) content = <Unavailable guest={guest} error={error} />;
  else if (dreamSlug) content = <DreamPage slug={dreamSlug} guest={guest} wedding={wedding} />;
  else
    content = (
      <>
        <GiftsHero guest={guest} />
        <Wishlist guest={guest} />
        {wedding.dreamsEnabled && <Dreams guest={guest} />}
      </>
    );

  return (
    <div className="gifts-page">
      <a className="skip-link" href="#gifts-main">
        Skip to content
      </a>
      <TopBar guest={guest} />
      <main id="gifts-main">{content}</main>
      <Footer />
    </div>
  );
}

function Unavailable({ guest, error }) {
  const home = withGuest('/', guest);
  // Network failure or server/proxy error: say so and offer a retry, rather than "not open".
  const unreachable = Boolean(error) && (error.status === 0 || error.status >= 500);
  return (
    <section className="section tone-parchment gifts-message">
      <div className="container container--narrow">
        <h1 className="script gifts-message__title">Wedding Gifts</h1>
        <p className="lede">
          {unreachable
            ? 'We could not load the gift page just now. Please check your connection and try again.'
            : 'The gift page is not open at the moment. Your presence is the only gift we need.'}
        </p>
        <div className="button-row">
          {unreachable && (
            <button type="button" className="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          )}
          <a className="button button--ghost" href={home} onClick={linkHandler(home)}>
            Back to the invitation
          </a>
        </div>
      </div>
    </section>
  );
}

function NotFound({ guest }) {
  const to = withGuest('/gifts', guest);
  return (
    <section className="section tone-parchment gifts-message">
      <div className="container container--narrow">
        <h1 className="script gifts-message__title">Page not found</h1>
        <p className="lede">This page may have moved. The full wishlist is just a tap away.</p>
        <div className="button-row">
          <a className="button" href={to} onClick={linkHandler(to)}>
            See all gifts
          </a>
        </div>
      </div>
    </section>
  );
}
