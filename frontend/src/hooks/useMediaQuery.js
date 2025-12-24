// src/hooks/useMediaQuery.js
import { useEffect, useState } from 'react';

export function useMediaQuery(query) {
  const [matches, set] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(query).matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const onChange = (e) => set(e.matches);
    mql.addEventListener?.('change', onChange) || mql.addListener(onChange);
    set(mql.matches);
    return () => {
      mql.removeEventListener?.('change', onChange) || mql.removeListener(onChange);
    };
  }, [query]);

  return matches;
}
