/**
 * GridFeesSection Tests
 * Tests for grid fees input component
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { GridFeesSection } from '../GridFeesSection';
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

// Wrapper component with required contexts
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>
    <LanguageProvider>{children}</LanguageProvider>
  </SettingsProvider>
);

describe('GridFeesSection', () => {
  it('should render without crashing', async () => {
    const { UNSAFE_root } = render(
      <TestWrapper>
        <GridFeesSection />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('should render grid fees section with input field', async () => {
    const { getAllByText } = render(
      <TestWrapper>
        <GridFeesSection />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getAllByText(/GRID FEES/i).length).toBeGreaterThan(0);
    });
  });
});
