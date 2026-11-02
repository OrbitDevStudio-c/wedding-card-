import { useEffect, useState } from 'react';

export function getRemaining(target, now = Date.now()) {
  const ms = Math.max(0, new Date(target).getTime() - now);
  // Round up so the display reads 00:00:01 during the final second, not 00:00:00
  const total = Math.ceil(ms / 1000);
  return {
    done: ms === 0,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function useCountdown(target) {
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    let timer;
    // Re-align to the next whole second each tick so the display never drifts.
    const tick = () => {
      const next = getRemaining(target);
      setRemaining(next);
      if (!next.done) timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
    return () => clearTimeout(timer);
  }, [target]);

  return remaining;
}
