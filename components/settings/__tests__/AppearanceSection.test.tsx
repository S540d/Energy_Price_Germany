/**
 * AppearanceSection Tests
 * Tests for theme selection component
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AppearanceSection } from '../AppearanceSection';
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

describe('AppearanceSection', () => {
  it('should render without crashing', async () => {
    const { UNSAFE_root } = render(
      <TestWrapper>
        <AppearanceSection />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('should render appearance section with theme options', async () => {
    const { getByText } = render(
      <TestWrapper>
        <AppearanceSection />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText(/APPEARANCE/i)).toBeTruthy();
    });
  });
});
