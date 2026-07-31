/**
 * CorrelationScatterChart Tests
 * Rendering, guard clauses (degenerate regression inputs) for the scatter chart.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { CorrelationScatterChart } from '../CorrelationScatterChart';
import { LanguageProvider } from '../../../context/LanguageContext';
import { getThemeColors } from '../../../utils/theme';

const colors = getThemeColors('light', 'light');

const labels = {
  yAxisPrice: 'ct/kWh',
  xAxisRenewables: '% Erneuerbare',
  night: 'Nacht',
  morningEvening: 'Morgen/Abend',
  day: 'Tag',
};

const baseTime = new Date('2026-01-01T00:00:00Z').getTime();
const hour = 60 * 60 * 1000;

// Varying price and renewable share so the linear regression isn't degenerate
// (constant renewableShare across all points makes the regression denominator 0,
// and constant marketPrice collapses priceRange to 0 — both are guarded null-returns).
function buildData(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: baseTime + i * hour,
    marketPrice: 200 + (i % 5) * 10,
    renewableShare: 20 + i * 3,
    isMarketPriceInterpolated: false,
    isRenewableShareInterpolated: false,
  }));
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

function renderChart(props: Partial<React.ComponentProps<typeof CorrelationScatterChart>> = {}) {
  return render(
    <TestWrapper>
      <CorrelationScatterChart
        title="Korrelation"
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

describe('CorrelationScatterChart', () => {
  it('renders without crashing for a normal dataset', async () => {
    const { UNSAFE_root } = renderChart();
    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('renders the title', async () => {
    const { getByText } = renderChart();
    await waitFor(() => {
      expect(getByText('Korrelation')).toBeTruthy();
    });
  });

  it('returns null (no crash) for an empty dataset', () => {
    const { toJSON } = renderChart({ data: [] });
    expect(toJSON()).toBeNull();
  });

  it('returns null (no crash) when every point is interpolated', () => {
    const data = buildData(10).map(d => ({ ...d, isMarketPriceInterpolated: true }));
    const { toJSON } = renderChart({ data });
    expect(toJSON()).toBeNull();
  });

  it('returns null (no crash) when marketPrice is constant (degenerate price range)', () => {
    const data = buildData(10).map(d => ({ ...d, marketPrice: 200 }));
    const { toJSON } = renderChart({ data });
    expect(toJSON()).toBeNull();
  });

  it('returns null (no crash) when renewableShare is constant (degenerate regression)', () => {
    const data = buildData(10).map(d => ({ ...d, renewableShare: 50 }));
    const { toJSON } = renderChart({ data });
    expect(toJSON()).toBeNull();
  });

  it('does not throw for a single valid data point', () => {
    const data = [buildData(1)[0]];
    expect(() => renderChart({ data })).not.toThrow();
  });
});
