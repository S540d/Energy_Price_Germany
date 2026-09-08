/**
 * RenewableBarChart Tests
 * Rendering, guard clauses and >100% split-bar handling for the renewables chart.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RenewableBarChart } from '../RenewableBarChart';
import { LanguageProvider } from '../../../context/LanguageContext';
import { getThemeColors } from '../../../utils/theme';

const colors = getThemeColors('light', 'light');

const labels = {
  yAxis: '%',
  now: 'Jetzt',
  average: 'Ø',
  regional: 'Regional',
};

const baseTime = new Date('2026-01-01T00:00:00Z').getTime();
const hour = 60 * 60 * 1000;

function buildData(
  count: number,
  overrides?: (
    i: number
  ) => Partial<{ renewableShare: number | null; renewableShareRegional: number | null }>
) {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: baseTime + i * hour,
    marketPrice: 20,
    renewableShare: 50,
    isRenewableShareInterpolated: false,
    ...(overrides ? overrides(i) : {}),
  }));
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

function renderChart(props: Partial<React.ComponentProps<typeof RenewableBarChart>> = {}) {
  return render(
    <TestWrapper>
      <RenewableBarChart
        title="Erneuerbare"
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

describe('RenewableBarChart', () => {
  it('renders without crashing for a normal dataset', async () => {
    const { UNSAFE_root } = renderChart();
    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('renders the title', async () => {
    const { getByText } = renderChart();
    await waitFor(() => {
      expect(getByText('Erneuerbare')).toBeTruthy();
    });
  });

  it('returns null (no crash) for an empty dataset', () => {
    const { toJSON } = renderChart({ data: [] });
    expect(toJSON()).toBeNull();
  });

  it('does not throw when every value is null (falls back to a default average)', async () => {
    const data = buildData(5, () => ({ renewableShare: null }));
    const { UNSAFE_root } = renderChart({ data });
    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('does not throw for values above 100% (split-bar rendering)', async () => {
    const data = buildData(10, i => (i === 2 ? { renewableShare: 130 } : {}));
    const { UNSAFE_root } = renderChart({ data });
    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('does not throw when all timestamps are identical', () => {
    const data = buildData(5).map(d => ({ ...d, timestamp: baseTime }));
    expect(() => renderChart({ data })).not.toThrow();
  });

  it('renders the regional dashed line without throwing when enabled', async () => {
    const data = buildData(10, i => ({ renewableShareRegional: 40 + i }));
    const { UNSAFE_root } = renderChart({ data, showRegionalLine: true });
    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('does not throw when regional values are missing while showRegionalLine is set', async () => {
    const data = buildData(10, () => ({ renewableShareRegional: null }));
    const { UNSAFE_root } = renderChart({ data, showRegionalLine: true });
    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
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
      expect(getByText('50.0%')).toBeTruthy();
    });
  });

  describe('average line coverage guard', () => {
    const coverageLabels = {
      ...labels,
      averageLowCoverage: 'Kein Ø: nur {valid} von {total} Werten',
    };

    it('shows the average when most points in the window have a value', async () => {
      const { queryByText } = renderChart({ data: buildData(24), labels: coverageLabels });
      await waitFor(() => {
        expect(queryByText('Ø 50.0%')).toBeTruthy();
      });
    });

    it('replaces the average with a coverage hint when most values are missing', async () => {
      // Entspricht dem Ausfall vom 2026-09-08: nur die ersten Punkte des
      // Fensters tragen Werte, der Rest des Tages ist leer. Ein Ø über diese
      // Reste sah plausibel aus und verdeckte den Ausfall.
      const data = buildData(24, i => (i < 4 ? {} : { renewableShare: null }));
      const { queryByText } = renderChart({ data, labels: coverageLabels });
      await waitFor(() => {
        expect(queryByText('Ø 50.0%')).toBeNull();
        expect(queryByText('Kein Ø: nur 4 von 24 Werten')).toBeTruthy();
      });
    });

    it('omits the hint entirely when no label is provided', async () => {
      const data = buildData(24, i => (i < 4 ? {} : { renewableShare: null }));
      const { queryByText } = renderChart({ data, labels });
      await waitFor(() => {
        expect(queryByText('Ø 50.0%')).toBeNull();
      });
    });
  });

  it('supports the renewableShareRegional dataKey without throwing', async () => {
    const data = buildData(10, i => ({ renewableShareRegional: 30 + i }));
    const { UNSAFE_root } = renderChart({ data, dataKey: 'renewableShareRegional' });
    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
