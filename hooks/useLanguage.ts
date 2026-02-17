import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { usePersistence } from './usePersistence';
import type { Language } from '../utils/translations';

/**
 * Hook for managing language state with persistence
 * Loads from storage on mount, auto-detects browser language as fallback
 * Automatically saves changes to storage
 */
export function useLanguage(): [Language, (lang: Language) => void] {
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);
  const { getItem, setItem } = usePersistence();
  const initRef = useRef(false);

  // Load language on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function loadLanguage() {
      try {
        const saved = (await getItem('language')) as Language | null;
        if (saved === 'en' || saved === 'de') {
          setLanguageState(saved);
        } else {
          // Auto-detect browser language on web
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const browserLang = window.navigator?.language?.toLowerCase() || 'en'; // platform-safe
            setLanguageState(browserLang.startsWith('de') ? 'de' : 'en');
          }
        }
      } catch (error) {
      } finally {
        setIsInitialized(true);
      }
    }

    loadLanguage();
  }, [getItem]);

  // Save language when it changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    async function saveLanguage() {
      try {
        await setItem('language', language);
      } catch (error) {}
    }

    saveLanguage();
  }, [language, isInitialized, setItem]);

  return [language, setLanguageState];
}
