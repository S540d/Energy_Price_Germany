import {
  validateMarketDataResponse,
  validateRegionalDataResponse,
  fetchWithTimeout,
} from '../apiValidation';

describe('apiValidation', () => {
  describe('validateMarketDataResponse', () => {
    const validResponse = {
      source: 'energy-charts',
      data: [
        {
          start_timestamp: 1000000,
          end_timestamp: 1000900,
          marketprice: 50.5,
          renewable_share: 45.2,
          interpolated: false,
        },
      ],
    };

    it('should accept a valid market data response', () => {
      const result = validateMarketDataResponse(validResponse);
      expect(result.source).toBe('energy-charts');
      expect(result.data).toHaveLength(1);
    });

    it('should accept null marketprice and renewable_share', () => {
      const response = {
        source: 'test',
        data: [
          {
            start_timestamp: 1,
            end_timestamp: 2,
            marketprice: null,
            renewable_share: null,
          },
        ],
      };
      expect(() => validateMarketDataResponse(response)).not.toThrow();
    });

    it('should throw when input is not an object', () => {
      expect(() => validateMarketDataResponse(null)).toThrow();
      expect(() => validateMarketDataResponse('string')).toThrow();
      expect(() => validateMarketDataResponse(42)).toThrow();
    });

    it('should throw when source is missing or not a string', () => {
      expect(() => validateMarketDataResponse({ data: [] })).toThrow('"source"');
      expect(() => validateMarketDataResponse({ source: 42, data: [] })).toThrow('"source"');
    });

    it('should throw when data is missing or not an array', () => {
      expect(() => validateMarketDataResponse({ source: 'test' })).toThrow('"data"');
      expect(() => validateMarketDataResponse({ source: 'test', data: 'not-array' })).toThrow(
        '"data"'
      );
    });

    it('should throw for invalid start_timestamp', () => {
      const bad = {
        source: 'test',
        data: [
          {
            start_timestamp: 'abc',
            end_timestamp: 1,
            marketprice: null,
            renewable_share: null,
          },
        ],
      };
      expect(() => validateMarketDataResponse(bad)).toThrow('start_timestamp');
    });

    it('should throw for invalid marketprice type', () => {
      const bad = {
        source: 'test',
        data: [
          {
            start_timestamp: 1,
            end_timestamp: 2,
            marketprice: 'bad',
            renewable_share: null,
          },
        ],
      };
      expect(() => validateMarketDataResponse(bad)).toThrow('marketprice');
    });

    it('should accept empty data array', () => {
      expect(() => validateMarketDataResponse({ source: 'test', data: [] })).not.toThrow();
    });
  });

  describe('validateRegionalDataResponse', () => {
    it('should accept a valid regional data response', () => {
      const result = validateRegionalDataResponse({
        unix_seconds: [1000000, 1000900],
        share: [50.0, 52.5],
      });
      expect(result.unix_seconds).toHaveLength(2);
      expect(result.share).toHaveLength(2);
    });

    it('should throw when input is not an object', () => {
      expect(() => validateRegionalDataResponse(null)).toThrow();
      expect(() => validateRegionalDataResponse(undefined)).toThrow();
    });

    it('should throw when unix_seconds is missing or not an array', () => {
      expect(() => validateRegionalDataResponse({ share: [] })).toThrow('"unix_seconds"');
    });

    it('should throw when share is missing or not an array', () => {
      expect(() => validateRegionalDataResponse({ unix_seconds: [] })).toThrow('"share"');
    });

    it('should throw when arrays have different lengths', () => {
      expect(() =>
        validateRegionalDataResponse({ unix_seconds: [1, 2, 3], share: [10, 20] })
      ).toThrow('different lengths');
    });

    it('should throw for non-number unix_seconds value', () => {
      expect(() => validateRegionalDataResponse({ unix_seconds: ['abc'], share: [10] })).toThrow(
        'unix_seconds'
      );
    });

    it('should throw for non-number share value', () => {
      expect(() => validateRegionalDataResponse({ unix_seconds: [1000], share: ['bad'] })).toThrow(
        'share'
      );
    });

    it('should accept empty arrays', () => {
      expect(() => validateRegionalDataResponse({ unix_seconds: [], share: [] })).not.toThrow();
    });
  });

  describe('fetchWithTimeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should resolve when fetch succeeds within timeout', async () => {
      const mockResponse = { ok: true, status: 200 } as Response;
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await fetchWithTimeout('https://example.com', {}, 5000);
      expect(result).toBe(mockResponse);
    });

    it('should pass options to fetch', async () => {
      const mockResponse = { ok: true } as Response;
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await fetchWithTimeout('https://example.com', { method: 'POST' }, 5000);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ method: 'POST', signal: expect.any(AbortSignal) })
      );
    });
  });
});
