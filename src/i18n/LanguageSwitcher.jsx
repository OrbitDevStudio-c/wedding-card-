import { useEffect, useState } from 'react';
import { LANGUAGES, useI18n } from './index.jsx';
import './LanguageSwitcher.css';

// [ EN | ગુજરાતી ] — two toggle buttons, so the current language is announced as "pressed"
// and switching is one tap or one keypress. Each label is marked with its own language.
// `tuck`: on phones and tablets the floating switcher slides away while the guest scrolls down
// (so it never sits over the text they are reading) and returns on scroll-up or near the top.
function useTucked(enabled) {
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    const narrow = window.matchMedia('(max-width: 1099px)');
    let lastY = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - lastY) > 6) setTucked(narrow.matches && y > lastY && y > 120);
        lastY = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);
  return tucked;
}

export function LanguageSwitcher({ className = '', tone = 'light', tuck = false }) {
  const { lang, setLang, t } = useI18n();
  const tucked = useTucked(tuck);
  return (
    <div
      className={`lang-switch lang-switch--${tone} ${tucked ? 'is-tucked' : ''} ${className}`}
      role="group"
      aria-label={t('lang.label')}
    >
      <svg className="lang-switch__globe" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
      </svg>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          className="lang-switch__option"
          aria-pressed={lang === l.code}
          aria-label={l.code === 'en' ? 'EN (English)' : 'ગુજરાતી (Gujarati)'}
          onClick={() => setLang(l.code)}
          data-testid={`lang-${l.code}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
