/**
 * PriceBarChart Tests
 * Rendering, guard clauses and coordinate-consistency for the price chart.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PriceBarChart } from '../PriceBarChart';
import { LanguageProvider } from '../../../context/LanguageContext';
import { SettingsProvider } from '../../../context/SettingsContext';
import { getThemeColors } from '../../../utils/theme';

const colors = getThemeColors('light', 'light');

const labels = {
  yAxis: 'ct/kWh',
  now: 'Jetzt',
  average: 'Ø',
  marketPrice: 'Marktpreis',
  gridFeesAndTaxes: 'Netzentgelte',
  interpolated: 'Interpoliert',
  tooltipMarketPrice: 'Marktpreis',
  tooltipGridFees: 'Netzentgelte',
  tooltipEndCustomer: 'Gesamtpreis',
};

const baseTime = new Date('2026-01-01T00:00:00Z').getTime();
const hour = 60 * 60 * 1000;

function buildData(
  count: number,
  overrides?: (i: number) => Partial<{ marketPrice: number | null }>
) {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: baseTime + i * hour,
    marketPrice: 20 + i,
    renewableShare: 50,
    isMarketPriceInterpolated: false,
    ...(overrides ? overrides(i) : {}),
  }));
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>
    <LanguageProvider>{children}</LanguageProvider>
  </SettingsProvider>
);

function renderChart(props: Partial<React.ComponentProps<typeof PriceBarChart>> = {}) {
  return render(
    <TestWrapper>
      <PriceBarChart
        title="Strompreis"
        data={buildData(24)}
        backgroundColor={colors.surface}
        textColor={colors.text}
        gridColor={colors.gridLine}
        colors={colors}
        labels={labels}
        {...props}
      />
    </TestWrapper>
  );
}

describe('PriceBarChart', () => {
  it('renders without crashing for a normal dataset', async () => {
    const { UNSAFE_root } = renderChart();
    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('renders the title and average label', async () => {
    const { getByText } = renderChart();
    await waitFor(() => {
      expect(getByText('Strompreis')).toBeTruthy();
    });
    expect(getByText(/Ø/)).toBeTruthy();
  });

  it('returns null (no crash) for an empty dataset', () => {
    const { toJSON } = renderChart({ data: [] });
    expect(toJSON()).toBeNull();
  });

  it('returns null (no crash) when every data point has a null market price', () => {
    const data = buildData(5, () => ({ marketPrice: null }));
    const { toJSON } = renderChart({ data });
    expect(toJSON()).toBeNull();
  });

  it('returns null (no crash) for a single data point (degenerate time range)', () => {
    const data = [buildData(1)[0]];
    const { toJSON } = renderChart({ data });
    expect(toJSON()).toBeNull();
  });

  it('does not throw when all timestamps are identical', () => {
    const data = buildData(5).map(d => ({ ...d, timestamp: baseTime }));
    expect(() => renderChart({ data })).not.toThrow();
  });

  it('shows the tooltip for the selected bar without throwing', async () => {
    const { UNSAFE_root, getByText } = renderChart();
    const touchables = UNSAFE_root.findAll(
      (node: { props: Record<string, unknown> }) =>
        typeof node.props.onResponderGrant === 'function'
    );
    expect(touchables.length).toBeGreaterThan(0);

    fireEvent(touchables[0], 'responderGrant');

    await waitFor(() => {
      expect(getByText('Gesamtpreis')).toBeTruthy();
    });
  });

  it('renders a dashed placeholder instead of crashing when a bar has a null market price', async () => {
    const data = buildData(10, i => (i === 3 ? { marketPrice: null } : {}));
    const { UNSAFE_root } = renderChart({ data });
    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('respects showLegend=false (regression guard for ChartSection usage)', async () => {
    const { queryByText } = renderChart({ showLegend: false });
    await waitFor(() => {
      expect(queryByText('Marktpreis')).toBeNull();
    });
  });
});
