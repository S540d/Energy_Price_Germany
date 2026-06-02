import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import { useSettings } from '../hooks/useSettings';
import type { Theme } from '../utils/theme';
import type { PriceDisplayMode } from '../hooks/useSettings';

interface SettingsContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  postalCode: string;
  setPostalCode: (code: string) => void;
  debouncedPostalCode: string;
  gridFees: number;
  setGridFees: (fees: number) => void;
  priceAlertLow: number | null;
  setPriceAlertLow: (value: number | null) => void;
  priceAlertHigh: number | null;
  setPriceAlertHigh: (value: number | null) => void;
  priceDisplayMode: PriceDisplayMode;
  setPriceDisplayMode: (mode: PriceDisplayMode) => void;
  historyCacheLimitMb: number;
  setHistoryCacheLimitMb: (mb: number) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

/**
 * Provider for settings context
 * Wraps the app to make settings available everywhere via useSettingsContext hook
 * Manages theme, postal code, and grid fees
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSettings();

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

/**
 * Hook to access settings context
 * Must be used within SettingsProvider
 */
export function useSettingsContext(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider');
  }
  return context;
}
