/**
 * PostalCodeSection Tests
 * Tests for postal code input component
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { PostalCodeSection } from '../PostalCodeSection';
import { LanguageProvider } from '../../../context/LanguageContext';
import { SettingsProvider } from '../../../context/SettingsContext';

// Mock theme utilities
jest.mock('../../../utils/theme', () => ({
  getThemeColors: jest.fn(() => ({
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#007AFF',
    gridLine: '#E0E0E0',
    surface: '#F5F5F5',
  })),
}));

// Mock postal code utilities
jest.mock('../../../utils/postalCodeUtils', () => ({
  sanitizePostalCodeInput: jest.fn((text: string) => text.replace(/[^0-9]/g, '')),
}));

// Wrapper component with required contexts
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>
    <LanguageProvider>{children}</LanguageProvider>
  </SettingsProvider>
);

describe('PostalCodeSection', () => {
  it('should render without crashing', async () => {
    const { UNSAFE_root } = render(
      <TestWrapper>
        <PostalCodeSection />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('should render postal code section with input field', async () => {
    const { getByText } = render(
      <TestWrapper>
        <PostalCodeSection />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText(/REGION/i)).toBeTruthy();
    });
  });
});
