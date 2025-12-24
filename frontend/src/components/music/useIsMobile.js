import { useEffect, useState } from 'react';

/** Returns true when viewport <= breakpoint (px). Default: 640 (tailwind 'sm') */
export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width:${breakpoint}px)`).matches
      : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width:${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    // modern add/remove
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, [breakpoint]);


  return isMobile;
}
