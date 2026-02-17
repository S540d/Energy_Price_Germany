import { EnergyData } from '../utils/metrics';
import { RegionalDataResponse } from './regionalDataCache';

/**
 * Timestamp tolerance for fuzzy matching regional data (60 seconds)
 */
const TIMESTAMP_TOLERANCE_MS = 60 * 1000;

/**
 * Merges regional renewable data into national energy data
 *
 * Timestamp conversion:
 * - Energy Charts Signal API returns timestamps in unix_seconds (seconds since epoch)
 * - The rest of the system uses JavaScript timestamps (milliseconds since epoch)
 * - Converts by multiplying by 1000
 * - Uses fuzzy matching (within 60 seconds) to handle timing offsets
 */
export function mergeRegionalData(
  nationalData: EnergyData[],
  regionalData: RegionalDataResponse | null
): EnergyData[] {
  if (!regionalData || !regionalData.unix_seconds || !regionalData.share) {
    return nationalData;
  }

  // Validate that both arrays have the same length
  if (regionalData.unix_seconds.length !== regionalData.share.length) {
    return nationalData;
  }

  try {
    // Build list of regional data with timestamps for fuzzy matching
    const regionalList: Array<{ timestamp: number; share: number }> = [];

    for (let i = 0; i < regionalData.unix_seconds.length; i++) {
      const timestampMs = regionalData.unix_seconds[i] * 1000;
      let share = regionalData.share[i];

      if (share !== null && share !== undefined) {
        // Cap share values to 0-100 range
        share = Math.max(0, Math.min(100, share));
        regionalList.push({ timestamp: timestampMs, share });
      }
    }

    // Merge using fuzzy matching
    const merged = nationalData.map(item => {
      // Try exact match first
      let regional = regionalList.find(r => r.timestamp === item.timestamp);

      // If no exact match, try fuzzy match (within tolerance)
      if (!regional) {
        regional = regionalList.find(r =>
          Math.abs(r.timestamp - item.timestamp) <= TIMESTAMP_TOLERANCE_MS
        );
      }

      return {
        ...item,
        renewableShareRegional: regional ? regional.share : null,
      };
    });

    return merged;
  } catch {
    return nationalData;
  }
}
