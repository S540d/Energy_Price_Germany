import { isValidPostalCode, sanitizePostalCodeInput } from '../postalCodeUtils';

describe('postalCodeUtils', () => {
  describe('isValidPostalCode', () => {
    it('should return true for valid 5-digit postal codes', () => {
      expect(isValidPostalCode('12345')).toBe(true);
      expect(isValidPostalCode('01234')).toBe(true);
      expect(isValidPostalCode('99999')).toBe(true);
    });

    it('should return false for strings shorter than 5 digits', () => {
      expect(isValidPostalCode('1234')).toBe(false);
      expect(isValidPostalCode('')).toBe(false);
      expect(isValidPostalCode('0')).toBe(false);
    });

    it('should return false for strings longer than 5 digits', () => {
      expect(isValidPostalCode('123456')).toBe(false);
    });

    it('should return false for non-numeric characters', () => {
      expect(isValidPostalCode('1234A')).toBe(false);
      expect(isValidPostalCode('ABCDE')).toBe(false);
      expect(isValidPostalCode('12 45')).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(isValidPostalCode(undefined)).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(isValidPostalCode(12345 as unknown as string)).toBe(false);
    });
  });

  describe('sanitizePostalCodeInput', () => {
    it('should strip non-numeric characters', () => {
      expect(sanitizePostalCodeInput('1A2B3')).toBe('123');
      expect(sanitizePostalCodeInput('abc12345')).toBe('12345');
    });

    it('should truncate to 5 characters', () => {
      expect(sanitizePostalCodeInput('123456789')).toBe('12345');
    });

    it('should preserve valid 5-digit input unchanged', () => {
      expect(sanitizePostalCodeInput('12345')).toBe('12345');
    });

    it('should return empty string for all-non-numeric input', () => {
      expect(sanitizePostalCodeInput('abcde')).toBe('');
    });

    it('should handle empty string', () => {
      expect(sanitizePostalCodeInput('')).toBe('');
    });

    it('should handle spaces and special characters', () => {
      expect(sanitizePostalCodeInput('1 2 3')).toBe('123');
      expect(sanitizePostalCodeInput('1-2345')).toBe('12345');
    });
  });
});
