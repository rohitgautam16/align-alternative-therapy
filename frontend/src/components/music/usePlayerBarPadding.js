// src/components/music/usePlayerBarPadding.js
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { usePlayerUI } from '../../context/PlayerUIContext';

// Inline constants (tweak freely here)
const DESKTOP_BAR_HEIGHT = 72; // your current desktop/tablet bar height
const MOBILE_BAR_HEIGHT  = 64; // your mobile compact bar height
const HANDLE_HEIGHT      = 4;  // collapsed handle height

// Tiny inline media hook so no extra file is needed
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width:${breakpoint}px)`).matches
      : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width:${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Returns a CSS string for padding-bottom that accounts for:
 * - no player (0)
 * - collapsed (handle height)
 * - expanded (bar height per device) + safe-area inset
 */
export function usePlayerBarPadding() {
  const { currentTrack } = useSelector(s => s.player);
  const { expanded } = usePlayerUI();
  const isMobile = useIsMobile(640);

  if (!currentTrack) return '0px';
  if (!expanded) return `${HANDLE_HEIGHT}px`;

  const bar = isMobile ? MOBILE_BAR_HEIGHT : DESKTOP_BAR_HEIGHT;
  return `calc(${bar}px + env(safe-area-inset-bottom, 0px))`;
}
