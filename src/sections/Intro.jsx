import { useEffect, useId, useRef, useState } from 'react';
import { couple, invitation } from '../config.js';
import { Monogram } from '../components/Monogram.jsx';
import { prefersReducedMotion } from '../lib/motion.js';
import './Intro.css';

const OPEN_DURATION = 2000;

function Seal() {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="seal" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-wax`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#f3dfae" />
          <stop offset="0.45" stopColor="#cfa863" />
          <stop offset="1" stopColor="#7c5a26" />
        </radialGradient>
      </defs>
      <path
        fill={`url(#${id}-wax)`}
        d="M100 6c9 0 13 7 21 9s16-3 22 3 3 14 8 20 14 6 17 14-3 13-1 21 9 12 7 21-10 11-12 19 4 16-2 22-15 2-21 7-6 15-15 17-12-6-21-6-13 8-21 6-8-11-15-15-17 0-21-7 2-15-2-22-12-10-13-19 6-13 6-21-8-14-4-22 13-7 17-14-1-15 6-20 15 1 22-3 11-11 21-11z"
      />
      <circle cx="100" cy="100" r="68" fill="none" stroke="#6b4c1f" strokeOpacity="0.45" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#fff3d6" strokeOpacity="0.35" strokeWidth="0.8" />
      <Monogram shimmer={false} label={false} className="seal__monogram" x="64" y="52" width="72" height="91" />
    </svg>
  );
}

function Door({ side }) {
  return (
    <div className={`intro__door intro__door--${side}`} aria-hidden="true">
      <div className="intro__panel">
        <svg className="intro__rosette" viewBox="0 0 100 100">
          <g fill="none" stroke="currentColor" strokeWidth="0.8">
            <circle cx="50" cy="50" r="46" />
            <circle cx="50" cy="50" r="38" strokeDasharray="1 3" />
            <circle cx="50" cy="50" r="8" />
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d="M50 42c-6-8-6-18 0-28 6 10 6 20 0 28z" transform={`rotate(${i * 30} 50 50)`} />
            ))}
          </g>
        </svg>
        <div className="intro__studs" />
      </div>
      <div className="intro__seal-half">
        <Seal />
      </div>
    </div>
  );
}

export function Intro({ guest, onOpen, onDone }) {
  const [state, setState] = useState('closed');
  const buttonRef = useRef(null);

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  const open = () => {
    if (state !== 'closed') return;
    setState('opening');
    onOpen();
    setTimeout(onDone, prefersReducedMotion() ? 300 : OPEN_DURATION);
  };

  return (
    <div className="intro" data-state={state} role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <Door side="left" />
      <Door side="right" />
      <div className="intro__content">
        <div className="intro__top">
          {guest && <p className="intro__greeting">{invitation.personalGreeting.replace('{guest}', guest)}</p>}
          <p className="label intro__eyebrow">You are invited to the wedding of</p>
          <p id="intro-title" className="script intro__names">
            {couple.bride.name} <span className="intro__amp">&amp;</span> {couple.groom.name}
          </p>
        </div>
        <button ref={buttonRef} type="button" className="intro__open" onClick={open} aria-label="Break the seal to open the invitation">
          <span className="intro__ring" />
          <span className="intro__ring intro__ring--late" />
        </button>
        <p className="label intro__hint" aria-hidden="true">
          Tap the seal to open
        </p>
      </div>
    </div>
  );
}
