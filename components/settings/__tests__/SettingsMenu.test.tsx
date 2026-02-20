/**
 * SettingsMenu Tests
 * Tests for main settings modal component
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SettingsMenu } from '../SettingsMenu';
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

// Mock Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}));

// Wrapper component with required contexts
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>
    <LanguageProvider>{children}</LanguageProvider>
  </SettingsProvider>
);

describe('SettingsMenu', () => {
  const mockOnClose = jest.fn();
  const mockOnOpenCustomize = jest.fn();
  const mockOnOpenAbout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible is true', async () => {
    const { getByText } = render(
      <TestWrapper>
        <SettingsMenu
          visible={true}
          onClose={mockOnClose}
          onOpenCustomize={mockOnOpenCustomize}
          onOpenAbout={mockOnOpenAbout}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText(/SETTINGS/i)).toBeTruthy();
    });
  });

  it('should not render when visible is false', () => {
    const { queryByText } = render(
      <TestWrapper>
        <SettingsMenu
          visible={false}
          onClose={mockOnClose}
          onOpenCustomize={mockOnOpenCustomize}
          onOpenAbout={mockOnOpenAbout}
        />
      </TestWrapper>
    );

    expect(queryByText(/SETTINGS/i)).toBeNull();
  });

  it('should render all main sections', async () => {
    const { getByText } = render(
      <TestWrapper>
        <SettingsMenu
          visible={true}
          onClose={mockOnClose}
          onOpenCustomize={mockOnOpenCustomize}
          onOpenAbout={mockOnOpenAbout}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      // Appearance section still in SettingsMenu
      expect(getByText(/APPEARANCE/i)).toBeTruthy();
      // Language moved to Customize modal – only the Customize button remains here
      expect(getByText(/Customize/i)).toBeTruthy();
      // Action links
      expect(getByText(/Send Feedback/i)).toBeTruthy();
    });
  });
});
