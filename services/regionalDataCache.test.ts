import { RegionalDataCache } from './regionalDataCache';
import { Storage } from '../utils/platform';

jest.mock('../utils/platform');
global.fetch = jest.fn();

describe('RegionalDataCache', () => {
  let cache: RegionalDataCache;

  const mockRegionalData = {
    unix_seconds: [1000000000, 1000003600],
    share: [50.0, 52.5],
  };

  const todayDateString = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  beforeEach(() => {
    cache = new RegionalDataCache();
    jest.clearAllMocks();
    (Storage.getItem as jest.Mock).mockResolvedValue(null);
    (Storage.setItem as jest.Mock).mockResolvedValue(undefined);
    (Storage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('loadFromStorage', () => {
    it('should return null when storage is empty', async () => {
      const result = await cache.loadFromStorage('12345');
      expect(result).toBeNull();
    });

    it('should return data when postal code matches and date is today', async () => {
      const entry = {
        postalCode: '12345',
        data: mockRegionalData,
        cachedDate: todayDateString,
        timestamp: Date.now(),
      };
      (Storage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(entry));

      const result = await cache.loadFromStorage('12345');
      expect(result).toEqual(mockRegionalData);
    });

    it('should return null when postal code does not match', async () => {
      const entry = {
        postalCode: '54321',
        data: mockRegionalData,
        cachedDate: todayDateString,
        timestamp: Date.now(),
      };
      (Storage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(entry));

      const result = await cache.loadFromStorage('12345');
      expect(result).toBeNull();
    });

    it('should return null when cached date is not today', async () => {
      const entry = {
        postalCode: '12345',
        data: mockRegionalData,
        cachedDate: '2020-01-01',
        timestamp: Date.now(),
      };
      (Storage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(entry));

      const result = await cache.loadFromStorage('12345');
      expect(result).toBeNull();
    });

    it('should return null on JSON parse error', async () => {
      (Storage.getItem as jest.Mock).mockResolvedValueOnce('invalid-json{');
      const result = await cache.loadFromStorage('12345');
      expect(result).toBeNull();
    });
  });

  describe('saveToStorage', () => {
    it('should save data to storage with correct structure', async () => {
      await cache.saveToStorage('12345', mockRegionalData);

      expect(Storage.setItem).toHaveBeenCalledWith(
        'energy_regional_cache_v1',
        expect.stringContaining('"postalCode":"12345"')
      );
    });

    it('should not throw when Storage.setItem fails', async () => {
      (Storage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage write error'));
      await expect(cache.saveToStorage('12345', mockRegionalData)).resolves.not.toThrow();
    });
  });

  describe('fetchRegionalData', () => {
    it('should return cached memory data on second call', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegionalData,
      });

      await cache.fetchRegionalData('12345');
      await cache.fetchRegionalData('12345');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should use persistent storage cache when memory cache is empty', async () => {
      const entry = {
        postalCode: '12345',
        data: mockRegionalData,
        cachedDate: todayDateString,
        timestamp: Date.now(),
      };
      (Storage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(entry));

      const result = await cache.fetchRegionalData('12345');

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toEqual(mockRegionalData);
    });

    it('should fetch from API when both caches miss', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegionalData,
      });

      const result = await cache.fetchRegionalData('12345');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRegionalData);
    });

    it('should return null when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const result = await cache.fetchRegionalData('12345');
      expect(result).toBeNull();
    });
  });

  describe('invalidate', () => {
    it('should clear memory cache and storage', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegionalData,
      });
      await cache.fetchRegionalData('12345');

      await cache.invalidate();

      expect(Storage.removeItem).toHaveBeenCalledWith('energy_regional_cache_v1');

      // After invalidation, next call should fetch again
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegionalData,
      });
      await cache.fetchRegionalData('12345');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not throw when Storage.removeItem fails', async () => {
      (Storage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      await expect(cache.invalidate()).resolves.not.toThrow();
    });
  });
});
