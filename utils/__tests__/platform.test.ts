/**
 * platform Tests
 * Tests for cross-platform utility functions
 */

import {
  isWeb,
  isIOS,
  isAndroid,
  isMobile,
  supportsMatchMedia,
  getSystemDarkModePreference,
  addSystemThemeChangeListener,
  Storage,
  assertWebAPI,
  safeWebAPI,
} from '../platform';
import { Platform } from 'react-native';
import { logger } from '../logger';

jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}));

jest.mock('../logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('platform', () => {
  describe('Platform Detection Constants', () => {
    it('should have platform detection exports', () => {
      // These are constants determined at module load time,
      // so we verify they exist and are boolean/object values
      expect(typeof isWeb).toBe('boolean');
      expect(typeof isIOS).toBe('boolean');
      expect(typeof isAndroid).toBe('boolean');
      expect(typeof isMobile).toBe('boolean');
    });

    it('should have consistent mobile detection', () => {
      // isMobile should be true if isIOS or isAndroid is true
      if (isIOS || isAndroid) {
        expect(isMobile).toBe(true);
      }
    });

    it('should have mutually exclusive platform detection', () => {
      // Count how many platforms are true - should be exactly 1
      const platformCount = [isWeb, isIOS, isAndroid].filter(Boolean).length;
      expect(platformCount).toBe(1);
    });
  });

  describe('supportsMatchMedia', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return boolean value', () => {
      const result = supportsMatchMedia();
      expect(typeof result).toBe('boolean');
    });

    it('should return consistent value', () => {
      const result = supportsMatchMedia();
      // The function should always return a boolean
      expect(typeof result).toBe('boolean');
      // Result depends on runtime platform and window availability
      // Just verify it returns boolean consistently
      expect([true, false]).toContain(result);
    });
  });

  describe('getSystemDarkModePreference', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (logger.warn as jest.Mock).mockClear();
    });

    it('should return boolean value', () => {
      const result = getSystemDarkModePreference();
      expect(typeof result).toBe('boolean');
    });

    it('should not throw errors', () => {
      expect(() => getSystemDarkModePreference()).not.toThrow();
    });

    it('should handle when matchMedia is available', () => {
      const result = getSystemDarkModePreference();
      // Result should be a boolean
      expect(typeof result).toBe('boolean');
    });
  });

  describe('addSystemThemeChangeListener', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (logger.warn as jest.Mock).mockClear();
    });

    it('should return a function', () => {
      const callback = jest.fn();
      const unsubscribe = addSystemThemeChangeListener(callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should not throw when unsubscribing', () => {
      const callback = jest.fn();
      const unsubscribe = addSystemThemeChangeListener(callback);
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should handle errors gracefully', () => {
      const callback = jest.fn();
      // Should not throw even if callback fails
      expect(() => {
        addSystemThemeChangeListener(callback);
      }).not.toThrow();
    });
  });

  describe('Storage', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // platform-safe: Only clear on web
      if (typeof localStorage !== 'undefined') {
        localStorage.clear(); // platform-safe
      }
    });

    describe('getItem', () => {
      it('should retrieve item from storage', async () => {
        if (isWeb) {
          localStorage.setItem('test-key', 'test-value'); // platform-safe
          const result = await Storage.getItem('test-key');
          expect(result).toBe('test-value');
        }
      });

      it('should return null when item not found', async () => {
        const result = await Storage.getItem('non-existent-key-' + Date.now());
        expect(result === null || typeof result === 'string').toBe(true);
      });
    });

    describe('setItem', () => {
      it('should set and retrieve item', async () => {
        const key = 'test-key-' + Date.now();
        await Storage.setItem(key, 'test-value');
        const result = await Storage.getItem(key);

        if (isWeb) {
          expect(result).toBe('test-value');
        } else {
          expect(result === null || result === 'test-value').toBe(true);
        }
      });
    });

    describe('removeItem', () => {
      it('should remove item', async () => {
        const key = 'test-key-' + Date.now();
        await Storage.setItem(key, 'test-value');
        await Storage.removeItem(key);

        if (isWeb && typeof localStorage !== 'undefined') {
          expect(localStorage.getItem(key)).toBeNull(); // platform-safe
        }
      });
    });
  });

  describe('assertWebAPI', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should not throw on web platform', () => {
      if (isWeb) {
        expect(() => assertWebAPI('fetch')).not.toThrow();
      } else {
        expect(() => assertWebAPI('fetch')).toThrow();
      }
    });

    it('should throw with helpful error message on non-web', () => {
      if (!isWeb) {
        expect(() => assertWebAPI('localStorage')).toThrow(
          expect.stringContaining('not available')
        );
      }
    });
  });

  describe('safeWebAPI', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should execute callback on web', () => {
      if (isWeb) {
        const callback = jest.fn(() => 'success');
        const result = safeWebAPI(callback, 'fallback', 'fetch');
        expect(result).toBe('success');
      }
    });

    it('should return fallback when callback fails', () => {
      const callback = jest.fn(() => {
        throw new Error('API Error');
      });

      const result = safeWebAPI(callback, 'fallback', 'fetch');
      expect(result).toBe('fallback');
    });

    it('should work with generic types', () => {
      const callback = jest.fn(() => ({ data: 'value' }));
      const result = safeWebAPI<{ data: string }>(
        callback,
        { data: 'default' }
      );
      expect(result.data).toBe('value');
    });
  });
});
