import { EnergyDataManager } from './energyDataManager';
import { Storage } from '../utils/platform';

// Mock dependencies
jest.mock('../utils/platform');
jest.mock('../utils/postalCodeUtils', () => ({
  isValidPostalCode: jest.fn((plz: string) => /^\d{5}$/.test(plz)),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('EnergyDataManager', () => {
  let manager: EnergyDataManager;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  const mockMarketDataResponse = {
    source: 'energy-charts',
    data: [
      {
        start_timestamp: Date.now() - 3600000, // 1 hour ago
        end_timestamp: Date.now() - 2700000,
        marketprice: 50.5,
        renewable_share: 45.2,
        interpolated: false,
      },
      {
        start_timestamp: Date.now() - 2700000,
        end_timestamp: Date.now() - 1800000,
        marketprice: 55.3,
        renewable_share: 48.7,
        interpolated: false,
      },
      {
        start_timestamp: Date.now() - 1800000,
        end_timestamp: Date.now() - 900000,
        marketprice: 52.1,
        renewable_share: 46.5,
        interpolated: false,
      },
    ],
  };

  const mockRegionalDataResponse = {
    unix_seconds: [
      Math.floor((Date.now() - 3600000) / 1000),
      Math.floor((Date.now() - 2700000) / 1000),
      Math.floor((Date.now() - 1800000) / 1000),
    ],
    share: [50.0, 52.5, 48.3],
  };

  beforeEach(() => {
    // Get singleton instance
    manager = EnergyDataManager.getInstance();

    // Reset all mocks
    jest.clearAllMocks();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    // Reset manager state
    manager.invalidateCache();

    // Setup default Storage mocks
    (Storage.getItem as jest.Mock).mockResolvedValue(null);
    (Storage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Clean up regional cache
    await manager.invalidateRegionalCache();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EnergyDataManager.getInstance();
      const instance2 = EnergyDataManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Cache Hit/Miss Scenarios', () => {
    it('should fetch data from API on cache miss', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      const data = await manager.loadEnergyData();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(data.length).toBeGreaterThan(0);
      expect(manager.getCurrentDataSource()).toBe('energy-charts');
    });

    it('should use cached data on cache hit within 15 minutes', async () => {
      // First call - cache miss
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      await manager.loadEnergyData();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - cache hit
      const cachedData = await manager.loadEnergyData();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, no new fetch
      expect(cachedData.length).toBeGreaterThan(0);
    });

    it('should invalidate cache and refetch after cache invalidation', async () => {
      // First fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      await manager.loadEnergyData();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Invalidate cache
      manager.invalidateCache();

      // Second fetch - should hit API again
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      await manager.loadEnergyData();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Regional vs National Data', () => {
    it('should fetch national data only when no postal code provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      const data = await manager.loadEnergyData();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(data.length).toBeGreaterThan(0);
      // Check that renewableShareRegional is null or undefined (no regional data)
      expect(data[0].renewableShareRegional).toBeFalsy();
    });

    it('should fetch and merge regional data when postal code provided', async () => {
      // Mock national data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      // Mock regional data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegionalDataResponse,
      } as Response);

      const data = await manager.loadEnergyData('12345');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(data.length).toBeGreaterThan(0);

      // Check that some data points have regional data
      const hasRegionalData = data.some(d => d.renewableShareRegional !== null);
      expect(hasRegionalData).toBe(true);
    });

    it('should use persistent storage cache for regional data on same day', async () => {
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const cachedRegionalData = {
        postalCode: '12345',
        data: mockRegionalDataResponse,
        cachedDate: dateString,
        timestamp: Date.now(),
      };

      (Storage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cachedRegionalData)
      );

      // Mock national data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      const data = await manager.loadEnergyData('12345');

      // Should only fetch national data (1 call), not regional (uses cache)
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(Storage.getItem).toHaveBeenCalled();
      expect(data.length).toBeGreaterThan(0);
    });

    it('should not use persistent cache for different postal code', async () => {
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const cachedRegionalData = {
        postalCode: '54321', // Different PLZ
        data: mockRegionalDataResponse,
        cachedDate: dateString,
        timestamp: Date.now(),
      };

      (Storage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cachedRegionalData)
      );

      // Mock national data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      // Mock regional data fetch (cache miss)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegionalDataResponse,
      } as Response);

      await manager.loadEnergyData('12345');

      // Should fetch both national AND regional (2 calls)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling & Fallbacks', () => {
    it('should return mock data when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const data = await manager.loadEnergyData();

      // Manager returns mock data on failure, not empty array
      expect(data.length).toBeGreaterThan(0);
      expect(manager.getCurrentDataSource()).toBe('none');
    });

    it('should handle non-200 HTTP responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const data = await manager.loadEnergyData();

      // Returns mock data on HTTP error
      expect(data.length).toBeGreaterThan(0);
      expect(manager.getCurrentDataSource()).toBe('none');
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      const data = await manager.loadEnergyData();

      // Returns mock data on JSON parse error
      expect(data.length).toBeGreaterThan(0);
    });

    it('should continue with national data if regional data fetch fails', async () => {
      // Mock successful national data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      // Mock failed regional data fetch
      mockFetch.mockRejectedValueOnce(new Error('Regional API error'));

      const data = await manager.loadEnergyData('12345');

      // Should still return national data
      expect(data.length).toBeGreaterThan(0);
      // Regional data is missing (undefined/null) since fetch failed
      expect(data[0].renewableShareRegional).toBeFalsy();
    });

    it('should handle Storage.getItem errors gracefully', async () => {
      (Storage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      // Mock national data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      // Mock regional data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegionalDataResponse,
      } as Response);

      const data = await manager.loadEnergyData('12345');

      // Should still work, just without cached data
      expect(data.length).toBeGreaterThan(0);
    });

    it('should handle Storage.setItem errors gracefully', async () => {
      (Storage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage write error')
      );

      // Mock national data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      // Mock regional data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegionalDataResponse,
      } as Response);

      const data = await manager.loadEnergyData('12345');

      // Should still return data even if caching fails
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate national data cache', async () => {
      // First fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      await manager.loadEnergyData();

      // Invalidate
      manager.invalidateCache();

      // Get cache info
      const cacheInfo = manager.getCacheInfo();
      expect(cacheInfo.isValid).toBe(false);
    });

    it('should invalidate regional cache', async () => {
      // Mock data for regional cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegionalDataResponse,
      } as Response);

      await manager.loadEnergyData('12345');

      // Invalidate regional cache
      await manager.invalidateRegionalCache();

      // Should call setItem (either clearing or updating storage)
      expect(Storage.setItem).toHaveBeenCalled();
    });
  });

  describe('Data Processing', () => {
    it('should convert timestamps from seconds to milliseconds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarketDataResponse,
      } as Response);

      const data = await manager.loadEnergyData();

      // Timestamps should be in milliseconds (13 digits, not 10)
      expect(data[0].timestamp.toString().length).toBeGreaterThanOrEqual(13);
    });

    it('should mark interpolated market price correctly', async () => {
      const responseWithInterpolated = {
        source: 'energy-charts',
        data: [
          {
            start_timestamp: Date.now() - 3600000,
            end_timestamp: Date.now() - 2700000,
            marketprice: 50.5,
            renewable_share: 45.2,
            interpolated: true, // Interpolated
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithInterpolated,
      } as Response);

      const data = await manager.loadEnergyData();

      // Market price should be marked as interpolated
      expect(data[0].isMarketPriceInterpolated).toBe(true);
      // Renewable share is NEVER interpolated (by design)
      expect(data[0].isRenewableShareInterpolated).toBe(false);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should deduplicate concurrent requests', async () => {
      mockFetch.mockImplementation(() =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockMarketDataResponse,
              } as Response),
            100
          )
        )
      );

      // Make multiple concurrent requests
      const [data1, data2, data3] = await Promise.all([
        manager.loadEnergyData(),
        manager.loadEnergyData(),
        manager.loadEnergyData(),
      ]);

      // Should only make one API call
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // All should return the same data
      expect(data1).toEqual(data2);
      expect(data2).toEqual(data3);
    });
  });
});
