/**
 * ClockChart Tests
 * Rendering, hour-bucket aggregation, and segment-selection for the 24h clock chart.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ClockChart } from '../ClockChart';
import { SettingsProvider } from '../../../context/SettingsContext';
import { getThemeColors } from '../../../utils/theme';

const colors = getThemeColors('light', 'light');

const labels = {
  now: 'Jetzt',
  average: 'Ø',
  pricePerKwh: 'ct/kWh',
  noData: 'Keine Daten',
};

function buildFullDayData(overrides?: (hour: number) => Partial<{ marketPrice: number | null }>) {
  const now = new Date();
  return Array.from({ length: 24 }, (_, hour) => {
    const d = new Date(now);
    d.setHours(hour, 0, 0, 0);
    return {
      timestamp: d.getTime(),
      marketPrice: 100 + hour * 5,
      renewableShare: 50,
      isMarketPriceInterpolated: false,
      ...(overrides ? overrides(hour) : {}),
    };
  });
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

function renderChart(props: Partial<React.ComponentProps<typeof ClockChart>> = {}) {
  return render(
    <TestWrapper>
      <ClockChart
        data={buildFullDayData()}
        backgroundColor={colors.surface}
        textColor={colors.text}
        colors={colors}
        gridFees={20}
        labels={labels}
        {...props}
      />
    </TestWrapper>
  );
}

describe('ClockChart', () => {
  it('renders without crashing for a full day of data', async () => {
    const { UNSAFE_root } = renderChart();
    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('shows the "now" label and a price for the current hour by default', async () => {
    const { getByText } = renderChart();
    await waitFor(() => {
      expect(getByText('Jetzt')).toBeTruthy();
    });
    expect(getByText('ct/kWh')).toBeTruthy();
  });

  it('shows the no-data label when every hour is empty', async () => {
    const data = buildFullDayData(() => ({ marketPrice: null }));
    const { getByText, queryByText } = renderChart({ data });
    await waitFor(() => {
      expect(getByText('Keine Daten')).toBeTruthy();
    });
    expect(queryByText('Jetzt')).toBeNull();
  });

  it('does not throw for an empty dataset (falls back to empty hour buckets)', async () => {
    const { getByText } = renderChart({ data: [] });
    await waitFor(() => {
      expect(getByText('Keine Daten')).toBeTruthy();
    });
  });

  it('does not throw when only some hours have data', async () => {
    const data = buildFullDayData(hour => (hour % 2 === 0 ? { marketPrice: null } : {}));
    const { UNSAFE_root } = renderChart({ data });
    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('selects an hour segment on hover (web) and shows its price range', async () => {
    const { UNSAFE_root, getByText } = renderChart();

    const segments = UNSAFE_root.findAll(
      (node: { type: unknown; props: Record<string, unknown> }) =>
        node.type === 'View' && typeof node.props.onMouseEnter === 'function'
    );
    expect(segments.length).toBe(24);

    fireEvent(segments[5], 'mouseEnter');

    await waitFor(() => {
      expect(getByText('5:00 – 6:00')).toBeTruthy();
    });
  });

  it('deselects the hour segment on mouse leave', async () => {
    const { UNSAFE_root, getByText, queryByText } = renderChart();
    const segments = UNSAFE_root.findAll(
      (node: { type: unknown; props: Record<string, unknown> }) =>
        node.type === 'View' && typeof node.props.onMouseEnter === 'function'
    );

    fireEvent(segments[5], 'mouseEnter');
    await waitFor(() => {
      expect(getByText('5:00 – 6:00')).toBeTruthy();
    });

    fireEvent(segments[5], 'mouseLeave');
    await waitFor(() => {
      expect(queryByText('5:00 – 6:00')).toBeNull();
    });
  });

  it('marks a fully-interpolated hour without throwing', async () => {
    const data = buildFullDayData(hour => (hour === 3 ? {} : {})).map((d, i) =>
      i === 3 ? { ...d, isMarketPriceInterpolated: true } : d
    );
    const { UNSAFE_root } = renderChart({ data });
    await waitFor(() => {
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
