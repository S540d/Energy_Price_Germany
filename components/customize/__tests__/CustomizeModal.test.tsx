/**
 * CustomizeModal Tests
 * Tests for customization modal component
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { CustomizeModal } from '../CustomizeModal';
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

describe('CustomizeModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible is true', async () => {
    const { getAllByText } = render(
      <TestWrapper>
        <CustomizeModal visible={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getAllByText(/CUSTOMIZE/i).length).toBeGreaterThan(0);
    });
  });

  it('should not render when visible is false', () => {
    const { queryByText } = render(
      <TestWrapper>
        <CustomizeModal visible={false} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(queryByText(/CUSTOMIZE/i)).toBeNull();
  });

  it('should render all three configuration sections', async () => {
    const { getAllByText } = render(
      <TestWrapper>
        <CustomizeModal visible={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getAllByText(/LANGUAGE/i).length).toBeGreaterThan(0);
      expect(getAllByText(/REGION/i).length).toBeGreaterThan(0);
      expect(getAllByText(/GRID FEES/i).length).toBeGreaterThan(0);
    });
  });
});
