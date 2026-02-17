import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import type { Language } from '../utils/translations';
import { translations } from '../utils/translations';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof translations)['en'];
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/**
 * Provider for language context
 * Wraps the app to make language available everywhere via useLanguageContext hook
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useLanguage();

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context
 * Must be used within LanguageProvider
 */
export function useLanguageContext(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within LanguageProvider');
  }
  return context;
}
