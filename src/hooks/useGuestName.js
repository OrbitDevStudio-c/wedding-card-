import { useMemo } from 'react';

// Reads ?guest=Name from the link so each guest can receive a personalised invite.
export function useGuestName() {
  return useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get('guest') || '';
    const clean = raw
      .replace(/[^\p{L}\p{M}\s.'&-]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40);
    return clean.replace(/(^|\s)(\p{Ll})/gu, (_, space, ch) => space + ch.toUpperCase());
  }, []);
}
