import { useEffect, useState } from 'react';

// One shared IntersectionObserver per option set keeps dozens of reveals cheap.
const observers = new Map();

function getObserver(rootMargin, threshold) {
  const key = `${rootMargin}|${threshold}`;
  if (!observers.has(key)) {
    const callbacks = new Map();
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => callbacks.get(entry.target)?.(entry.isIntersecting)),
      { rootMargin, threshold },
    );
    observers.set(key, { observer, callbacks });
  }
  return observers.get(key);
}

export function useInView(ref, { once = true, rootMargin = '0px 0px -10% 0px', threshold = 0 } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const { observer, callbacks } = getObserver(rootMargin, threshold);
    callbacks.set(el, (visible) => {
      setInView(visible);
      if (visible && once) {
        observer.unobserve(el);
        callbacks.delete(el);
      }
    });
    observer.observe(el);
    return () => {
      observer.unobserve(el);
      callbacks.delete(el);
    };
  }, [ref, once, rootMargin, threshold]);

  return inView;
}
