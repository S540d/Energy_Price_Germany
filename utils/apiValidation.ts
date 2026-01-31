/**
 * API Response Validation using JSON Schema
 * Ensures API responses match expected structure before processing
 * Prevents silent parsing failures if API contracts change
 */

export interface MarketDataItem {
  start_timestamp: number;
  end_timestamp: number;
  marketprice: number | null;
  renewable_share: number | null;
  interpolated?: boolean;
}

export interface MarketDataResponse {
  source: string;
  data: MarketDataItem[];
}

export interface RegionalDataResponse {
  unix_seconds: number[];
  share: number[];
}

/**
 * Validates market data response structure
 * @throws Error if validation fails
 */
export function validateMarketDataResponse(data: unknown): MarketDataResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Market data response is not an object');
  }

  const obj = data as Record<string, unknown>;

  // Validate source
  if (typeof obj.source !== 'string') {
    throw new Error('Invalid or missing "source" field in market data response');
  }

  // Validate data array
  if (!Array.isArray(obj.data)) {
    throw new Error('Invalid or missing "data" field in market data response');
  }

  // Validate each item in the data array
  for (let i = 0; i < obj.data.length; i++) {
    const item = obj.data[i];
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid market data item at index ${i}: not an object`);
    }

    const dataItem = item as Record<string, unknown>;

    // Validate required number fields
    if (typeof dataItem.start_timestamp !== 'number') {
      throw new Error(`Invalid start_timestamp at index ${i}`);
    }
    if (typeof dataItem.end_timestamp !== 'number') {
      throw new Error(`Invalid end_timestamp at index ${i}`);
    }

    // Validate optional fields (can be null or number)
    if (dataItem.marketprice !== null && typeof dataItem.marketprice !== 'number') {
      throw new Error(`Invalid marketprice at index ${i}`);
    }
    if (dataItem.renewable_share !== null && typeof dataItem.renewable_share !== 'number') {
      throw new Error(`Invalid renewable_share at index ${i}`);
    }

    // Validate optional boolean field
    if (dataItem.interpolated !== undefined && typeof dataItem.interpolated !== 'boolean') {
      throw new Error(`Invalid interpolated at index ${i}`);
    }
  }

  return obj as MarketDataResponse;
}

/**
 * Validates regional data response structure
 * @throws Error if validation fails
 */
export function validateRegionalDataResponse(data: unknown): RegionalDataResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Regional data response is not an object');
  }

  const obj = data as Record<string, unknown>;

  // Validate unix_seconds array
  if (!Array.isArray(obj.unix_seconds)) {
    throw new Error('Invalid or missing "unix_seconds" field in regional data response');
  }

  // Validate share array
  if (!Array.isArray(obj.share)) {
    throw new Error('Invalid or missing "share" field in regional data response');
  }

  // Validate array contents
  for (let i = 0; i < obj.unix_seconds.length; i++) {
    const timestamp = obj.unix_seconds[i];
    if (typeof timestamp !== 'number') {
      throw new Error(`Invalid unix_seconds value at index ${i}`);
    }
  }

  for (let i = 0; i < obj.share.length; i++) {
    const share = obj.share[i];
    if (typeof share !== 'number') {
      throw new Error(`Invalid share value at index ${i}`);
    }
  }

  // Validate array lengths match
  if (obj.unix_seconds.length !== obj.share.length) {
    throw new Error('unix_seconds and share arrays have different lengths');
  }

  return obj as RegionalDataResponse;
}

/**
 * Wrap fetch with timeout support
 * @param url Request URL
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds (default: 10000ms)
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
