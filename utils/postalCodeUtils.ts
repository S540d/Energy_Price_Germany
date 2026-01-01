/**
 * Postal code (PLZ) validation utilities
 */

/**
 * Validates if a postal code is valid for API calls
 * @param postalCode - The postal code to validate
 * @returns true if the postal code is exactly 5 numeric digits
 */
export function isValidPostalCode(postalCode: string | undefined): boolean {
  if (typeof postalCode !== 'string') {
    return false;
  }
  // Must be exactly 5 numeric digits
  return /^[0-9]{5}$/.test(postalCode);
}

/**
 * Filters input to only allow numeric characters and limit to 5 digits
 * @param input - Raw input string
 * @returns Sanitized postal code (numeric only, max 5 chars)
 */
export function sanitizePostalCodeInput(input: string): string {
  return input.replace(/[^0-9]/g, '').substring(0, 5);
}
