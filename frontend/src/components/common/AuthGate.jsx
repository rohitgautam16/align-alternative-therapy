import { useEffect, useRef, useState } from 'react';

const MIN_VISIBLE_MS = 1000;
const FADE_MS = 300;

export default function AuthGate({ loading }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const startRef = useRef(0);

  useEffect(() => {
    if (loading) {
      startRef.current = Date.now();
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    const elapsed = Date.now() - startRef.current;
    const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);

    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setMounted(false), FADE_MS);
    }, remaining);

    return () => clearTimeout(t);
  }, [loading]);

  if (!mounted) return null;

  return (
    <>
      {/* Scoped animation – no global CSS, no Tailwind config */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Fullscreen auth gate */}
      <div
        className={`
          fixed inset-0 z-[9999]
          flex items-center justify-center
          bg-black
          transition-opacity duration-${FADE_MS}
          ${visible ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {/* Loader ring */}
        <div
          className="
            h-[200px] w-[200px]
            rounded-full
            motion-safe:[animation:spin_1s_linear_infinite]
          "
          style={{
            boxShadow: 'inset 2px 0 0 white, -2px 0 0 white',
          }}
        />
      </div>
    </>
  );
}
