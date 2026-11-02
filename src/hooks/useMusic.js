import { useCallback, useEffect, useRef, useState } from 'react';

const FADE_IN = 1.6;
const FADE_OUT = 0.6;

// Background music with smooth fades. A Web Audio gain node is used where available
// because iOS ignores HTMLMediaElement.volume.
export function useMusic({ src, volume }) {
  const audioRef = useRef(null);
  const graphRef = useRef(null);
  const pauseTimer = useRef(0);
  const resumeOnShow = useRef(false);
  const [playing, setPlaying] = useState(false);

  const ensureGraph = useCallback(() => {
    if (graphRef.current !== null) return graphRef.current;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    graphRef.current = false;
    if (!AudioCtx) return false;
    try {
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      ctx.createMediaElementSource(audioRef.current).connect(gain).connect(ctx.destination);
      graphRef.current = { ctx, gain };
    } catch {
      graphRef.current = false;
    }
    return graphRef.current;
  }, []);

  const fadeTo = useCallback(
    (target, seconds) => {
      const audio = audioRef.current;
      const graph = ensureGraph();
      if (graph) {
        const { ctx, gain } = graph;
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(target, now + seconds);
        return;
      }
      const from = audio.volume;
      const start = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - start) / (seconds * 1000));
        audio.volume = from + (target - from) * p;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    [ensureGraph],
  );

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    clearTimeout(pauseTimer.current);
    if (!audio.getAttribute('src')) audio.src = src;
    const graph = ensureGraph();
    if (graph && graph.ctx.state === 'suspended') graph.ctx.resume();
    if (!graph) audio.volume = 0;
    setPlaying(true);
    audio.play().then(
      () => fadeTo(volume, FADE_IN),
      () => setPlaying(false),
    );
  }, [src, volume, ensureGraph, fadeTo]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setPlaying(false);
    fadeTo(0, FADE_OUT);
    clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => audio.pause(), FADE_OUT * 1000 + 50);
  }, [fadeTo]);

  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);

  // Pause while the guest switches to another app (e.g. back to WhatsApp), resume on return.
  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        resumeOnShow.current = !audio.paused;
        audio.pause();
      } else if (resumeOnShow.current) {
        audio.play().catch(() => setPlaying(false));
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(pauseTimer.current);
    };
  }, []);

  return { audioRef, playing, play, toggle };
}
