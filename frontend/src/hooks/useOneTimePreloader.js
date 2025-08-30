import { useEffect, useState, useCallback } from "react";

export default function useOneTimePreloader({
  storageKey = "preloader_seen",
  ttlMs = null, 
  storage = typeof window !== "undefined" ? window.sessionStorage : null,
} = {}) {
  const [show, setShow] = useState(undefined); // undefined while deciding

  useEffect(() => {
    if (!storage) return;
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) { setShow(true); return; }
      if (ttlMs == null) { setShow(false); return; }
      const { t } = JSON.parse(raw);
      setShow(!(t && Date.now() - t < ttlMs));
    } catch {
      setShow(false);
    }
  }, [storage, storageKey, ttlMs]);

  const complete = useCallback(() => {
    try {
      if (ttlMs == null) storage?.setItem(storageKey, "1");
      else storage?.setItem(storageKey, JSON.stringify({ t: Date.now() }));
    } catch {}
    setShow(false);
  }, [storage, storageKey, ttlMs]);

  const reset = useCallback(() => { try { storage?.removeItem(storageKey); } catch {} }, [storage, storageKey]);

  return { show, complete, reset };
}
