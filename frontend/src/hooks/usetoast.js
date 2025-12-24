// src/hooks/useToast.js
import { useState, useCallback } from 'react';

export default function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((all) => [...all, { id, message, type }]);
    setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), 3000);
  }, []);
  return { toasts, addToast };
}
