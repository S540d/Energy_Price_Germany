import React, { useMemo } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { borderRadius, spacing } from '../../utils/designSystem';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';
import { SkeletonBar, SkeletonText } from './SkeletonLoader';

function BarRow({ heights }: { heights: number[] }) {
  return (
    <View style={styles.barRow}>
      {heights.map((h, i) => (
        <SkeletonBar
          key={i}
          height={h}
          width={`${Math.floor(80 / heights.length)}%` as `${number}%`}
          style={styles.bar}
        />
      ))}
    </View>
  );
}

// Varied bar heights to look like a realistic chart
const PRICE_HEIGHTS = [60, 80, 45, 90, 70, 55, 100, 65, 75, 50, 85, 40];
const RENEWABLE_HEIGHTS = [70, 55, 80, 65, 90, 75, 50, 85, 60, 95, 45, 70];

interface ChartSkeletonCardProps {
  title?: boolean;
}

function ChartSkeletonCard({ title = true }: ChartSkeletonCardProps) {
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
    >
      {title && (
        <View style={styles.header}>
          <SkeletonText width="45%" style={styles.skeletonTitleMargin} />
          <SkeletonText width="65%" style={styles.skeletonSmall} />
        </View>
      )}
      <View style={styles.chartArea}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          {[0, 1, 2, 3].map(i => (
            <SkeletonText key={i} width={28} style={styles.skeletonSmall} />
          ))}
        </View>
        {/* Bars */}
        <View style={styles.barsContainer}>
          <BarRow heights={title ? PRICE_HEIGHTS : RENEWABLE_HEIGHTS} />
        </View>
      </View>
      {/* X-axis labels */}
      <View style={styles.xAxis}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonText key={i} width={30} style={{ height: 10 }} />
        ))}
      </View>
    </View>
  );
}

export function ChartSkeleton() {
  return (
    <View style={styles.container}>
      <ChartSkeletonCard title={true} />
      <ChartSkeletonCard title={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  bar: {
    marginHorizontal: 2,
  },
  skeletonTitleMargin: {
    marginBottom: spacing.xs,
  },
  skeletonSmall: {
    height: 10,
  },
  header: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  chartArea: {
    flexDirection: 'row',
    height: 160,
    gap: spacing.sm,
  },
  yAxis: {
    width: 32,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: spacing.xs,
  },
  barsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    justifyContent: 'space-between',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingLeft: 40,
  },
});
