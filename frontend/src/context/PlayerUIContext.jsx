// src/context/PlayerUIContext.jsx
import React, { createContext, useContext, useState } from 'react';

const PlayerUIContext = createContext();
export function PlayerUIProvider({ children }) {
  const [expanded, setExpanded] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  return (
    <PlayerUIContext.Provider
      value={{
        expanded,
        toggleExpanded: () => setExpanded(e => !e),
        fullScreen,
        toggleFullScreen: () => setFullScreen(f => !f),
      }}
    >
      {children}
    </PlayerUIContext.Provider>
  );
}
export const usePlayerUI = () => useContext(PlayerUIContext);
