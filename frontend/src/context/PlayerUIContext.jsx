// src/context/PlayerUIContext.jsx
import { createContext, useCallback, useContext, useState } from 'react';

const PlayerUIContext = createContext();
export function PlayerUIProvider({ children }) {
  const [expanded, setExpanded] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const [visible, setVisible] = useState(true);

  const toggleExpanded = useCallback(() => setExpanded(e => !e), []);
  const toggleFullScreen = useCallback(() => setFullScreen(f => !f), []);
  const hidePlayer = useCallback(() => setVisible(false), []);
  const showPlayer = useCallback(() => setVisible(true), []);

  return (
    <PlayerUIContext.Provider
      value={{
        expanded,
        toggleExpanded,
        fullScreen,
        toggleFullScreen,
        visible,
        hidePlayer,
        showPlayer,
      }}
    >
      {children}
    </PlayerUIContext.Provider>
  );
}
export const usePlayerUI = () => useContext(PlayerUIContext);
