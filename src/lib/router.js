import { useEffect, useState } from 'react';

// A deliberately tiny router: the invitation is one page, and the gifts and couple areas are
// separate code-split pages chosen by path. Links use navigate() for in-app transitions.
export function navigate(to, { replace = false } = {}) {
  if (to === window.location.pathname + window.location.search) return;
  history[replace ? 'replaceState' : 'pushState'](null, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path.replace(/\/+$/, '') || '/';
}

// Carries ?guest=Name across pages so the personalised greeting follows the guest.
export function withGuest(path, guest) {
  return guest ? `${path}?guest=${encodeURIComponent(guest)}` : path;
}

// Plain left-clicks become in-app navigation; modified clicks open a new tab as usual.
export function linkHandler(to) {
  return (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
}
