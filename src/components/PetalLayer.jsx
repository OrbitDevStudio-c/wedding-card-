import { useEffect, useRef } from 'react';
import { petals } from '../lib/petals.js';

// Mounted once the invitation opens: ambient petals, bursts, and a desktop cursor trail.
export function PetalLayer() {
  const ref = useRef(null);

  useEffect(() => {
    petals.mount(ref.current);
    petals.setAmbient(true);
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const onMove = (e) => fine.matches && petals.trail(e.clientX, e.clientY);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      petals.setAmbient(false);
      petals.unmount();
    };
  }, []);

  return <canvas ref={ref} className="petal-layer" aria-hidden="true" />;
}
