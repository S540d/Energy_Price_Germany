import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLanguageContext } from '../context/LanguageContext';
import { getThemeColors } from '../utils/theme';
import { useSettingsContext } from '../context/SettingsContext';
import { historicalDataStore } from '../services/historicalDataStore';
import { aggregateEnergyData } from '../utils/dataAggregation';
import { computeHistoricalStats, type SeriesStat } from '../utils/historicalStats';
import type { EnergyData } from '../utils/metrics';
import { PriceBarChart } from './charts/PriceBarChart';
import { RenewableBarChart } from './charts/RenewableBarChart';

type TimeRange = '24h' | '48h' | '7d' | '30d';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const RANGE_WINDOW_MS: Record<TimeRange, number> = {
  '24h': DAY_MS,
  '48h': 2 * DAY_MS,
  '7d': 7 * DAY_MS,
  '30d': 30 * DAY_MS,
};

// Aggregations-Bucket je Zeitbereich (0 = volle 15-min-Auflösung)
const RANGE_BUCKET_MS: Record<TimeRange, number> = {
  '24h': 0,
  '48h': HOUR_MS,
  '7d': HOUR_MS,
  '30d': DAY_MS,
};

interface HistoricalDataViewProps {
  visible: boolean;
  onClose: () => void;
  /** Aktuelle (Live-)Daten aus dem Hauptscreen für den jüngsten Zeitraum. */
  liveData: EnergyData[];
  gridFees: number;
}

/**
 * Vollbild-Ansicht für historische Daten (Issues #1, #3, #307).
 * Zeitbereich-Auswahl + Preis-/Erneuerbaren-Chart aus dem Gerätecache
 * (mit Server-Fallback) + Statistik-Übersicht.
 */
export function HistoricalDataView({
  visible,
  onClose,
  liveData,
  gridFees,
}: HistoricalDataViewProps) {
  const { t } = useLanguageContext();
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [rangeData, setRangeData] = useState<EnergyData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const now = Date.now();
      const from = now - RANGE_WINDOW_MS[timeRange];
      const historical = await historicalDataStore.getRange(from, now);
      if (cancelled) return;

      // Cache + Live mergen (Live gewinnt per Timestamp), nur ab "from".
      const map = new Map<number, EnergyData>();
      for (const d of historical) map.set(d.timestamp, d);
      for (const d of liveData) {
        if (d.timestamp >= from) map.set(d.timestamp, d);
      }
      const merged = Array.from(map.values())
        .filter(d => d.timestamp >= from)
        .sort((a, b) => a.timestamp - b.timestamp);

      setRangeData(merged);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [visible, timeRange, liveData]);

  const displayData = useMemo(() => {
    const bucket = RANGE_BUCKET_MS[timeRange];
    return bucket > 0 ? aggregateEnergyData(rangeData, bucket) : rangeData;
  }, [rangeData, timeRange]);

  const stats = useMemo(() => computeHistoricalStats(rangeData), [rangeData]);

  const priceLabels = {
    yAxis: t.pricePerKwh,
    now: t.now,
    average: t.average,
    marketPrice: t.marketPrice,
    gridFeesAndTaxes: t.gridFeesAndTaxes,
    interpolated: t.interpolated,
    tooltipMarketPrice: t.tooltipMarketPrice,
    tooltipGridFees: t.tooltipGridFees,
    tooltipEndCustomer: t.tooltipEndCustomer,
  };

  const renewableLabels = {
    yAxis: t.renewablePercent,
    now: t.now,
    average: t.average,
  };

  if (!visible) return null;

  const ranges: TimeRange[] = ['24h', '48h', '7d', '30d'];
  const rangeLabel: Record<TimeRange, string> = {
    '24h': t.historyRange24h,
    '48h': t.historyRange48h,
    '7d': t.historyRange7d,
    '30d': t.historyRange30d,
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <StatusBar style={colors.background === '#000000' ? 'light' : 'dark'} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.gridLine },
        ]}
      >
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.historyViewTitle}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Time range selector (#1) */}
        <View style={styles.rangeRow}>
          {ranges.map(r => (
            <TouchableOpacity
              key={r}
              style={[
                styles.rangeButton,
                { backgroundColor: timeRange === r ? colors.primary : colors.gridLine },
              ]}
              onPress={() => setTimeRange(r)}
              accessibilityRole="button"
            >
              <Text
                style={[styles.rangeButtonText, { color: timeRange === r ? '#fff' : colors.text }]}
              >
                {rangeLabel[r]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : displayData.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t.historyEmpty}
            </Text>
          </View>
        ) : (
          <>
            {/* Statistics (#3) */}
            <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statsTitle, { color: colors.text }]}>{t.historyStatsTitle}</Text>
              <StatBlock
                title={t.historyPriceSection}
                stat={stats.price}
                unit="¢"
                colors={colors}
                t={t}
              />
              <StatBlock
                title={t.historyRenewableSection}
                stat={stats.renewable}
                unit="%"
                colors={colors}
                t={t}
              />
            </View>

            {/* Charts */}
            <View style={styles.chartBlock}>
              <PriceBarChart
                title={t.priceTitle}
                data={displayData}
                backgroundColor={colors.surface}
                textColor={colors.text}
                gridColor={colors.gridLine}
                colors={colors}
                labels={priceLabels}
                gridFees={gridFees}
                showLegend={false}
                accentColor={colors.accentAmber}
              />
            </View>

            <View style={styles.chartBlock}>
              <RenewableBarChart
                title={t.renewableTitle}
                data={displayData}
                backgroundColor={colors.surface}
                textColor={colors.text}
                gridColor={colors.gridLine}
                colors={colors}
                labels={renewableLabels}
                dataKey="renewableShare"
                showLegend={false}
                accentColor={colors.accentGreen}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function trendLabel(stat: SeriesStat, t: Record<string, string>): string {
  if (stat.trend === 'up') return `↑ ${t.historyTrendUp}`;
  if (stat.trend === 'down') return `↓ ${t.historyTrendDown}`;
  return `→ ${t.historyTrendFlat}`;
}

interface StatBlockProps {
  title: string;
  stat: SeriesStat | null;
  unit: string;
  colors: ReturnType<typeof getThemeColors>;
  t: Record<string, string>;
}

function StatBlock({ title, stat, unit, colors, t }: StatBlockProps) {
  if (!stat) return null;
  const fmt = (v: number) => `${v.toFixed(1)} ${unit}`;
  const rows: Array<[string, string]> = [
    [t.metricAvg, fmt(stat.avg)],
    [t.metricMin, fmt(stat.min.value)],
    [t.metricMax, fmt(stat.max.value)],
    [t.historyStatMedian, fmt(stat.median)],
    [t.historyStatTrend, trendLabel(stat, t)],
  ];
  return (
    <View style={styles.statBlock}>
      <Text style={[styles.statBlockTitle, { color: colors.textSecondary }]}>{title}</Text>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    gap: 16,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 20,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsCard: {
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statBlock: {
    gap: 6,
  },
  statBlockTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartBlock: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});
