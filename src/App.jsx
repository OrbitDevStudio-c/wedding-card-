import { memo, startTransition, useCallback, useEffect, useState } from 'react';
import { music as musicConfig } from './config.js';
import { FloatingControls } from './components/FloatingControls.jsx';
import { PetalLayer } from './components/PetalLayer.jsx';
import { useGuestName } from './hooks/useGuestName.js';
import { useMusic } from './hooks/useMusic.js';
import { Blessings } from './sections/Blessings.jsx';
import { Countdown } from './sections/Countdown.jsx';
import { DateReveal } from './sections/DateReveal.jsx';
import { Events } from './sections/Events.jsx';
import { Footer } from './sections/Footer.jsx';
import { Gallery } from './sections/Gallery.jsx';
import { Hero } from './sections/Hero.jsx';
import { Intro } from './sections/Intro.jsx';
import { Rsvp } from './sections/Rsvp.jsx';
import { Story } from './sections/Story.jsx';
import { Travel } from './sections/Travel.jsx';
import { Venue } from './sections/Venue.jsx';

// Memoised so opening the doors re-renders none of them; the open state is pure CSS (.site.is-open)
const SECTIONS = Object.entries({ Hero, Story, DateReveal, Countdown, Venue, Events, Gallery, Travel, Rsvp, Blessings }).map(
  ([key, Section]) => [key, memo(Section)],
);
const LAST_STAGE = SECTIONS.length + 1; // every section, then the footer

export default function App() {
  const guest = useGuestName();
  const music = useMusic(musicConfig);
  const [opened, setOpened] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  // The intro paints first; sections then mount one per idle slot so no single commit blocks input.
  useEffect(() => {
    if (stage >= LAST_STAGE) return undefined;
    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 16));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = schedule(() => startTransition(() => setStage((s) => s + 1)), { timeout: 200 });
    return () => cancel(id);
  }, [stage]);

  useEffect(() => {
    document.body.classList.toggle('is-locked', !introDone);
  }, [introDone]);

  const handleOpen = useCallback(() => {
    music.play();
    setOpened(true);
  }, [music]);

  const handleDone = useCallback(() => setIntroDone(true), []);

  return (
    <>
      {!introDone && <Intro guest={guest} onOpen={handleOpen} onDone={handleDone} />}

      <div className={`site ${opened ? 'is-open' : ''}`} inert={introDone ? undefined : ''}>
        <main id="main">
          {SECTIONS.slice(0, stage).map(([key, Section]) => (
            <Section key={key} guest={guest} />
          ))}
        </main>
        {stage >= LAST_STAGE && <Footer />}
      </div>

      {/* Mounted after the doors finish so the tap itself does as little work as possible */}
      {introDone && <FloatingControls music={music} />}
      {introDone && <PetalLayer />}
      <audio ref={music.audioRef} loop preload="none" aria-hidden="true" />
    </>
  );
}
