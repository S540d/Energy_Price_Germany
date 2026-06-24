import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import { useCountry } from '../hooks/useCountry';
import type { CountryCode, CountryConfig } from '../utils/countries';
import { COUNTRIES } from '../utils/countries';

interface CountryContextValue {
  country: CountryCode;
  setCountry: (country: CountryCode) => void;
  /** Resolved config for the active country. */
  countryConfig: CountryConfig;
}

const CountryContext = createContext<CountryContextValue | undefined>(undefined);

/**
 * Provider for the active country.
 * Wraps the app so the selected country is available everywhere via
 * useCountryContext. Independent from language (see CLAUDE.md / Issue #356).
 */
export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useCountry();

  return (
    <CountryContext.Provider
      value={{
        country,
        setCountry,
        countryConfig: COUNTRIES[country],
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

/**
 * Hook to access the country context.
 * Must be used within CountryProvider.
 */
export function useCountryContext(): CountryContextValue {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error('useCountryContext must be used within CountryProvider');
  }
  return context;
}
