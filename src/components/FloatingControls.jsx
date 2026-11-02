import { useEffect, useState } from 'react';
import { share, SITE_URL } from '../config.js';
import { Icon } from './Icon.jsx';
import './FloatingControls.css';

export function whatsappShareUrl() {
  const url = window.location.hostname === 'localhost' ? SITE_URL : window.location.origin + window.location.pathname;
  return `https://wa.me/?text=${encodeURIComponent(`${share.message}\n${url}`)}`;
}

export function FloatingControls({ music }) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let ticking = false;
    let lastY = window.scrollY;
    // On phones the stack sits over the text column, so "back to top" only appears while scrolling up
    const wide = window.matchMedia('(min-width: 768px)');
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setShowTop(y > window.innerHeight * 1.2 && (wide.matches || y < lastY));
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="floating">
      <button
        type="button"
        className={`floating__button floating__top ${showTop ? 'is-shown' : ''}`}
        onClick={() => window.scrollTo({ top: 0 })}
        aria-label="Back to top"
        aria-hidden={showTop ? undefined : 'true'}
        tabIndex={showTop ? 0 : -1}
      >
        <Icon name="arrowUp" />
      </button>
      <a
        className="floating__button floating__whatsapp"
        href={whatsappShareUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share the invitation on WhatsApp"
      >
        <Icon name="whatsapp" />
      </a>
      <button
        type="button"
        className={`floating__button floating__music ${music.playing ? 'is-playing' : ''}`}
        onClick={music.toggle}
        aria-pressed={music.playing}
        aria-label={music.playing ? 'Mute background music' : 'Play background music'}
      >
        <Icon name={music.playing ? 'music' : 'musicOff'} />
        <span className="floating__bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </button>
    </div>
  );
}
