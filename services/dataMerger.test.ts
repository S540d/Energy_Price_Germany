import { mergeRegionalData } from './dataMerger';

import type { EnergyData } from '../utils/metrics';
import type { RegionalDataResponse } from '../utils/apiValidation';

describe('dataMerger', () => {
  describe('mergeRegionalData', () => {
    const baseNationalData: EnergyData[] = [
      {
        timestamp: 1000000000000,
        marketPrice: 50,
        renewableShare: 45,
      } as EnergyData,
      {
        timestamp: 1000003600000,
        marketPrice: 55,
        renewableShare: 48,
      } as EnergyData,
      {
        timestamp: 1000007200000,
        marketPrice: 52,
        renewableShare: 46,
      } as EnergyData,
    ];

    it('should return national data unchanged when regionalData is null', () => {
      const result = mergeRegionalData(baseNationalData, null);
      expect(result).toEqual(baseNationalData);
    });

    it('should return national data unchanged when unix_seconds is missing', () => {
      const result = mergeRegionalData(baseNationalData, {
        unix_seconds: undefined as unknown as number[],
        share: [50],
      });
      expect(result).toEqual(baseNationalData);
    });

    it('should return national data unchanged when array lengths mismatch', () => {
      const result = mergeRegionalData(baseNationalData, {
        unix_seconds: [1000000000, 1000003600],
        share: [50],
      });
      expect(result).toEqual(baseNationalData);
    });

    it('should merge regional data using exact timestamp match', () => {
      const regionalData: RegionalDataResponse = {
        unix_seconds: [1000000000, 1000003600, 1000007200],
        share: [70, 72, 68],
      };

      const result = mergeRegionalData(baseNationalData, regionalData);

      expect(result[0].renewableShareRegional).toBe(70);
      expect(result[1].renewableShareRegional).toBe(72);
      expect(result[2].renewableShareRegional).toBe(68);
    });

    it('should merge using fuzzy matching within 60-second tolerance', () => {
      const regionalData: RegionalDataResponse = {
        unix_seconds: [1000000030, 1000003600, 1000007200],
        share: [70, 72, 68],
      };

      const result = mergeRegionalData(baseNationalData, regionalData);
      expect(result[0].renewableShareRegional).toBe(70);
    });

    it('should set renewableShareRegional to null when no match found', () => {
      const farAwayRegional: RegionalDataResponse = {
        unix_seconds: [9999999999],
        share: [80],
      };

      const result = mergeRegionalData(baseNationalData, farAwayRegional);

      expect(result[0].renewableShareRegional).toBeNull();
      expect(result[1].renewableShareRegional).toBeNull();
      expect(result[2].renewableShareRegional).toBeNull();
    });

    it('should cap regional share values to 0-100 range', () => {
      const regionalData: RegionalDataResponse = {
        unix_seconds: [1000000000, 1000003600, 1000007200],
        share: [150, -10, 50],
      };

      const result = mergeRegionalData(baseNationalData, regionalData);

      expect(result[0].renewableShareRegional).toBe(100);
      expect(result[1].renewableShareRegional).toBe(0);
      expect(result[2].renewableShareRegional).toBe(50);
    });

    it('should skip null share values in regional data', () => {
      const regionalData = {
        unix_seconds: [1000000000, 1000003600],
        share: [null, 72] as unknown as number[],
      };

      const result = mergeRegionalData(
        baseNationalData,
        regionalData as unknown as RegionalDataResponse
      );

      expect(result[0].renewableShareRegional).toBeNull();
      expect(result[1].renewableShareRegional).toBe(72);
    });

    it('should preserve all original national data fields', () => {
      const regionalData: RegionalDataResponse = {
        unix_seconds: [1000000000],
        share: [70],
      };

      const result = mergeRegionalData(baseNationalData, regionalData);

      expect(result[0].timestamp).toBe(baseNationalData[0].timestamp);
      expect(result[0].marketPrice).toBe(baseNationalData[0].marketPrice);
      expect(result[0].renewableShare).toBe(baseNationalData[0].renewableShare);
    });
  });
});
