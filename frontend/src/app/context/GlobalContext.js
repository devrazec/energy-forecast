"use client";

import { createContext, useState, useEffect } from "react";

export const GlobalContext = createContext();

export function GlobalProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileDevice, setMobileDevice] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("/");
    
  return (
    <GlobalContext.Provider
      value={{
        darkMode,
        setDarkMode,
        mobileDevice,
        setMobileDevice,
        currentUrl,
        setCurrentUrl,
    
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}
