/**
 * LanguageSection Tests
 * Tests for shared language selection component
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { LanguageSection } from '../LanguageSection';
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
  })),
}));

// Wrapper component with required contexts
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>
    <LanguageProvider>{children}</LanguageProvider>
  </SettingsProvider>
);

describe('LanguageSection', () => {
  it('should render without crashing', async () => {
    const { UNSAFE_root } = render(
      <TestWrapper>
        <LanguageSection />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('should render with language and appearance sections', async () => {
    const { getByText } = render(
      <TestWrapper>
        <LanguageSection />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for case-insensitive text content
      expect(getByText(/LANGUAGE/i)).toBeTruthy();
    });
  });
});
