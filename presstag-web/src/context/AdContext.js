'use client';
import { createContext, useContext } from 'react';

const AdContext = createContext([]);

export function AdProvider({ children, ads }) {
  return (
    <AdContext.Provider value={ads || []}>
      {children}
    </AdContext.Provider>
  );
}

export function useAds() {
  return useContext(AdContext);
}
