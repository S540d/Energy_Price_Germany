import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { useLanguageContext } from '../context/LanguageContext';
import { getThemeColors } from '../utils/theme';
import { useSettingsContext } from '../context/SettingsContext';
import type { Appliance } from './CostCalculator';

interface PricePoint {
  start_timestamp: number;
  marketprice: number; // EUR/MWh
}

interface ApplianceTimelineProps {
  appliances: Appliance[];
  priceData: PricePoint[];
  gridFees: number; // ct/kWh
}

interface HourSlot {
  hour: number; // 0–23, always Berlin local time via getHours()
  label: string;
  avgPriceCtPerKwh: number;
}

interface ApplianceResult {
  appliance: Appliance;
  /** Hours belonging to the optimal run window (may wrap past midnight). */
  windowHours: Set<number>;
  bestStartHour: number;
  currentAvgPrice: number;
  savingsEuro: number;
}

/**
 * A rendered column is either a single hour cell or a collapsed gap block
 * representing multiple consecutive "uninteresting" hours.
 */
type Column = { type: 'hour'; slot: HourSlot } | { type: 'gap'; hours: number[] };

const HOUR_CELL_WIDTH = 36;
const GAP_CELL_WIDTH = 20;
const ROW_LABEL_WIDTH = 108;

function buildHourSlots(
  priceData: PricePoint[],
  gridFees: number,
  currentHourStartMs: number
): HourSlot[] {
  const hourMap = new Map<number, number[]>();

  priceData.forEach(item => {
    // Only include slots that start at or after the beginning of the current hour.
    // This correctly excludes past timestamps from previous days even when their
    // hour-of-day value is >= currentHour (e.g. yesterday's 18:00 with currentHour=15).
    if (item.start_timestamp < currentHourStartMs) return;
    const date = new Date(item.start_timestamp);
    const hour = date.getHours();
    const priceCtPerKwh = item.marketprice * 0.1 + gridFees;
    const existing = hourMap.get(hour) ?? [];
    existing.push(priceCtPerKwh);
    hourMap.set(hour, existing);
  });

  const slots: HourSlot[] = [];
  for (let h = 0; h < 24; h++) {
    const prices = hourMap.get(h);
    if (!prices || prices.length === 0) continue;
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    slots.push({ hour: h, label: h.toString().padStart(2, '0'), avgPriceCtPerKwh: avg });
  }
  return slots;
}

/**
 * Finds the cheapest consecutive window of `durationHours` hours.
 * Works on actual hour values (not array indices) so sparse data doesn't
 * cause non-consecutive hours to be treated as adjacent.
 * Returns the set of hours in the window and metadata.
 */
function findBestWindow(
  slots: HourSlot[],
  durationHours: number
): { windowHours: Set<number>; startHour: number; avgPrice: number } | null {
  if (slots.length < durationHours) return null;

  // Build a lookup: hour → price
  const priceByHour = new Map<number, number>(slots.map(s => [s.hour, s.avgPriceCtPerKwh]));

  let bestAvg = Infinity;
  let bestStartIdx = 0;

  for (let i = 0; i <= slots.length - durationHours; i++) {
    // Verify the window is truly consecutive (handles sparse slots)
    let consecutive = true;
    for (let j = i; j < i + durationHours - 1; j++) {
      if (slots[j + 1].hour !== slots[j].hour + 1) {
        consecutive = false;
        break;
      }
    }
    if (!consecutive) continue;

    let sum = 0;
    for (let j = i; j < i + durationHours; j++) sum += slots[j].avgPriceCtPerKwh;
    const avg = sum / durationHours;
    if (avg < bestAvg) {
      bestAvg = avg;
      bestStartIdx = i;
    }
  }

  if (bestAvg === Infinity) return null; // no consecutive window found

  const startHour = slots[bestStartIdx].hour;
  const windowHours = new Set<number>();
  for (let j = 0; j < durationHours; j++) {
    windowHours.add((startHour + j) % 24);
  }

  // Re-calculate avgPrice from the priceByHour map for accuracy
  let sum = 0;
  windowHours.forEach(h => {
    sum += priceByHour.get(h) ?? 0;
  });
  const avgPrice = sum / durationHours;

  return { windowHours, startHour, avgPrice };
}

/**
 * Builds Column descriptors. Consecutive uninteresting hours (≥2) are
 * merged into a single narrow gap column.
 */
function buildColumns(slots: HourSlot[], results: ApplianceResult[]): Column[] {
  const interesting = new Set<number>();
  results.forEach(r => r.windowHours.forEach(h => interesting.add(h)));

  const columns: Column[] = [];
  let gapAccum: number[] = [];

  const flush = () => {
    if (gapAccum.length >= 2) {
      columns.push({ type: 'gap', hours: gapAccum });
    } else {
      gapAccum.forEach(h => {
        const slot = slots.find(s => s.hour === h);
        if (slot) columns.push({ type: 'hour', slot });
      });
    }
    gapAccum = [];
  };

  slots.forEach(slot => {
    if (interesting.has(slot.hour)) {
      flush();
      columns.push({ type: 'hour', slot });
    } else {
      gapAccum.push(slot.hour);
    }
  });
  flush();

  return columns;
}

function ApplianceTimelineComponent({ appliances, priceData, gridFees }: ApplianceTimelineProps) {
  const { t, language } = useLanguageContext();
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  const currentHour = useMemo(() => new Date().getHours(), []);

  // Start of the current hour in ms – used to filter out past timestamps correctly
  // across multi-day rolling data windows (prevents yesterday's 18:00 from being
  // treated as a future slot when currentHour is also 18).
  const currentHourStartMs = useMemo(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.getTime();
  }, []);

  const slots = useMemo(
    () => buildHourSlots(priceData, gridFees, currentHourStartMs),
    [priceData, gridFees, currentHourStartMs]
  );

  const results: ApplianceResult[] = useMemo(() => {
    if (slots.length === 0) return [];

    return appliances.map(appliance => {
      const best = findBestWindow(slots, appliance.durationHours);

      // Average price starting from the current slot for the appliance duration
      const currentSlotIdx = slots.findIndex(s => s.hour >= currentHour);
      let currentAvgPrice = slots[slots.length - 1]?.avgPriceCtPerKwh ?? 0; // fallback: last known slot
      if (currentSlotIdx >= 0) {
        const end = Math.min(currentSlotIdx + appliance.durationHours, slots.length);
        const count = end - currentSlotIdx;
        if (count > 0) {
          const sum = slots.slice(currentSlotIdx, end).reduce((a, s) => a + s.avgPriceCtPerKwh, 0);
          currentAvgPrice = sum / count;
        }
      }

      const bestAvgPrice = best ? best.avgPrice : currentAvgPrice;
      const bestStartHour = best ? best.startHour : currentHour;
      const windowHours =
        best?.windowHours ??
        (() => {
          const s = new Set<number>();
          for (let j = 0; j < appliance.durationHours; j++) {
            s.add((currentHour + j) % 24);
          }
          return s;
        })();

      const currentCost = (appliance.kwh * currentAvgPrice) / 100;
      const bestCost = (appliance.kwh * bestAvgPrice) / 100;
      const savingsEuro = Math.max(0, currentCost - bestCost);

      return { appliance, windowHours, bestStartHour, currentAvgPrice, savingsEuro };
    });
  }, [slots, appliances, currentHour]);

  const columns = useMemo(() => buildColumns(slots, results), [slots, results]);

  if (slots.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t.costTimeline}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header row */}
          <View style={styles.headerRow}>
            <View style={{ width: ROW_LABEL_WIDTH }} />
            {columns.map((col, ci) => {
              if (col.type === 'gap') {
                const first = col.hours[0];
                const last = col.hours[col.hours.length - 1];
                return (
                  <View key={`gap-${first}`} style={styles.gapCell}>
                    <Text style={[styles.gapLabel, { color: colors.textTertiary }]}>
                      {first.toString().padStart(2, '0')}–{last.toString().padStart(2, '0')}
                    </Text>
                  </View>
                );
              }
              return (
                <View key={`h-${col.slot.hour}-${ci}`} style={styles.hourCell}>
                  <Text style={[styles.hourLabel, { color: colors.textTertiary }]}>
                    {col.slot.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Appliance rows */}
          {results.map(result => {
            const { appliance, windowHours, bestStartHour, savingsEuro } = result;
            const name = language === 'de' ? appliance.nameDE : appliance.nameEN;

            return (
              <View key={appliance.id} style={styles.applianceRow}>
                {/* Label */}
                <View style={[styles.rowLabel, { width: ROW_LABEL_WIDTH }]}>
                  <View style={[styles.rowTag, { backgroundColor: colors.background }]}>
                    <Text style={[styles.rowTagText, { color: colors.textSecondary }]}>
                      {appliance.shortLabel}
                    </Text>
                  </View>
                  <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={2}>
                    {name}
                  </Text>
                </View>

                {/* Columns */}
                {columns.map((col, ci) => {
                  if (col.type === 'gap') {
                    const anyInWindow = col.hours.some(h => windowHours.has(h));
                    return (
                      <View
                        key={`gap-${col.hours[0]}`}
                        style={[
                          styles.gapCell,
                          anyInWindow && {
                            backgroundColor: `${colors.success}30`,
                            borderTopWidth: 2,
                            borderBottomWidth: 2,
                            borderColor: colors.success,
                          },
                        ]}
                      />
                    );
                  }

                  const inWindow = windowHours.has(col.slot.hour);
                  const isStart = col.slot.hour === bestStartHour;

                  // Determine rounded corners: round left if no previous column is in-window
                  const prevCol = ci > 0 ? columns[ci - 1] : null;
                  const nextCol = ci < columns.length - 1 ? columns[ci + 1] : null;
                  const prevInWindow =
                    prevCol?.type === 'gap'
                      ? prevCol.hours.some(h => windowHours.has(h))
                      : prevCol?.type === 'hour'
                        ? windowHours.has(prevCol.slot.hour)
                        : false;
                  const nextInWindow =
                    nextCol?.type === 'gap'
                      ? nextCol.hours.some(h => windowHours.has(h))
                      : nextCol?.type === 'hour'
                        ? windowHours.has(nextCol.slot.hour)
                        : false;

                  const roundLeft = inWindow && !prevInWindow;
                  const roundRight = inWindow && !nextInWindow;

                  return (
                    <View
                      key={`h-${col.slot.hour}-${ci}`}
                      style={[
                        styles.hourCell,
                        inWindow && {
                          backgroundColor: `${colors.success}30`,
                          borderTopWidth: 2,
                          borderBottomWidth: 2,
                          borderColor: colors.success,
                        },
                        roundLeft && {
                          borderLeftWidth: 2,
                          borderTopLeftRadius: 6,
                          borderBottomLeftRadius: 6,
                        },
                        roundRight && {
                          borderRightWidth: 2,
                          borderTopRightRadius: 6,
                          borderBottomRightRadius: 6,
                        },
                      ]}
                    >
                      {isStart && savingsEuro > 0.005 && (
                        <Text style={[styles.savingsLabel, { color: colors.success }]}>
                          {'-'}
                          {savingsEuro < 0.1
                            ? `${(savingsEuro * 100).toFixed(0)}¢`
                            : `${savingsEuro.toFixed(2)}€`}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}

          {/* Legend */}
          <View style={styles.legend}>
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor: `${colors.success}30`,
                  borderColor: colors.success,
                  borderWidth: 1.5,
                },
              ]}
            />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              {t.costTimelineRecommended}
            </Text>
            <Text style={[styles.legendSep, { color: colors.textTertiary }]}>·</Text>
            <Text style={[styles.legendText, { color: colors.textTertiary }]}>
              {t.costTimelineSave}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export const ApplianceTimeline = React.memo(ApplianceTimelineComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  applianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginVertical: 3,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    gap: 4,
  },
  rowTag: {
    minWidth: 32,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rowName: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  hourCell: {
    width: HOUR_CELL_WIDTH,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gapCell: {
    width: GAP_CELL_WIDTH,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  gapLabel: {
    fontSize: 7,
    textAlign: 'center',
    lineHeight: 9,
  },
  savingsLabel: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
  },
  legendSep: {
    fontSize: 11,
    marginHorizontal: 2,
  },
});
