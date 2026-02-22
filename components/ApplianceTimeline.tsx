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
  hour: number;
  label: string;
  avgPriceCtPerKwh: number; // ct/kWh including grid fees
}

interface ApplianceResult {
  appliance: Appliance;
  bestStartHour: number;
  bestEndHour: number;
  bestAvgPrice: number;
  currentAvgPrice: number;
  savingsEuro: number;
}

const HOUR_CELL_WIDTH = 36;
const ROW_LABEL_WIDTH = 108;

/**
 * Aggregates 15-min price intervals into hourly average prices (ct/kWh incl. grid fees).
 */
function buildHourSlots(priceData: PricePoint[], gridFees: number): HourSlot[] {
  const hourMap = new Map<number, number[]>();

  priceData.forEach(item => {
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
    const label = h.toString().padStart(2, '0');
    slots.push({ hour: h, label, avgPriceCtPerKwh: avg });
  }
  return slots;
}

/**
 * Finds the cheapest consecutive window of `durationHours` hours in the slots array.
 */
function findBestWindow(
  slots: HourSlot[],
  durationHours: number
): { startIdx: number; endIdx: number; avgPrice: number } | null {
  if (slots.length < durationHours) return null;

  let bestAvg = Infinity;
  let bestStart = 0;

  for (let i = 0; i <= slots.length - durationHours; i++) {
    let sum = 0;
    for (let j = i; j < i + durationHours; j++) {
      sum += slots[j].avgPriceCtPerKwh;
    }
    const avg = sum / durationHours;
    if (avg < bestAvg) {
      bestAvg = avg;
      bestStart = i;
    }
  }

  return { startIdx: bestStart, endIdx: bestStart + durationHours - 1, avgPrice: bestAvg };
}

/**
 * Returns current-hour average price from slots (or first slot as fallback).
 */
function getCurrentHourPrice(slots: HourSlot[]): number {
  if (slots.length === 0) return 0;
  const currentHour = new Date().getHours();
  const slot = slots.find(s => s.hour === currentHour);
  return slot ? slot.avgPriceCtPerKwh : slots[0].avgPriceCtPerKwh;
}

export function ApplianceTimeline({ appliances, priceData, gridFees }: ApplianceTimelineProps) {
  const { t, language } = useLanguageContext();
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  const slots = useMemo(() => buildHourSlots(priceData, gridFees), [priceData, gridFees]);

  const results: ApplianceResult[] = useMemo(() => {
    if (slots.length === 0) return [];

    return appliances.map(appliance => {
      const best = findBestWindow(slots, appliance.durationHours);
      const currentHourPrice = getCurrentHourPrice(slots);

      // Average price over current + following hours for the appliance duration
      const currentHour = new Date().getHours();
      const currentSlotIdx = slots.findIndex(s => s.hour >= currentHour);
      let currentAvgPrice = currentHourPrice;
      if (currentSlotIdx >= 0) {
        const end = Math.min(currentSlotIdx + appliance.durationHours, slots.length);
        const count = end - currentSlotIdx;
        if (count > 0) {
          const sum = slots.slice(currentSlotIdx, end).reduce((a, s) => a + s.avgPriceCtPerKwh, 0);
          currentAvgPrice = sum / count;
        }
      }

      const bestAvgPrice = best ? best.avgPrice : currentAvgPrice;
      const bestStartHour = best ? slots[best.startIdx].hour : currentHour;
      const bestEndHour = best
        ? slots[best.endIdx].hour
        : currentHour + appliance.durationHours - 1;

      const currentCost = (appliance.kwh * currentAvgPrice) / 100;
      const bestCost = (appliance.kwh * bestAvgPrice) / 100;
      const savingsEuro = Math.max(0, currentCost - bestCost);

      return {
        appliance,
        bestStartHour,
        bestEndHour,
        bestAvgPrice,
        currentAvgPrice,
        savingsEuro,
      };
    });
  }, [slots, appliances]);

  if (slots.length === 0) return null;

  const currentHour = new Date().getHours();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t.costTimeline}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Hour header row */}
          <View style={styles.headerRow}>
            <View style={{ width: ROW_LABEL_WIDTH }} />
            {slots.map(slot => {
              const isNow = slot.hour === currentHour;
              return (
                <View
                  key={slot.hour}
                  style={[styles.hourCell, isNow && { backgroundColor: `${colors.primary}20` }]}
                >
                  <Text
                    style={[
                      styles.hourLabel,
                      { color: isNow ? colors.primary : colors.textTertiary },
                      isNow && { fontWeight: '700' },
                    ]}
                  >
                    {slot.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Appliance rows */}
          {results.map(result => {
            const { appliance, bestStartHour, bestEndHour, savingsEuro } = result;
            const name = language === 'de' ? appliance.nameDE : appliance.nameEN;

            return (
              <View key={appliance.id} style={styles.applianceRow}>
                {/* Row label */}
                <View style={[styles.rowLabel, { width: ROW_LABEL_WIDTH }]}>
                  <Text style={styles.rowIcon}>{appliance.icon}</Text>
                  <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={2}>
                    {name}
                  </Text>
                </View>

                {/* Hour cells */}
                {slots.map(slot => {
                  const inWindow = slot.hour >= bestStartHour && slot.hour <= bestEndHour;
                  const isStart = slot.hour === bestStartHour;
                  const isEnd = slot.hour === bestEndHour;

                  return (
                    <View
                      key={slot.hour}
                      style={[
                        styles.hourCell,
                        inWindow && {
                          backgroundColor: `${colors.success}30`,
                          borderTopWidth: 2,
                          borderBottomWidth: 2,
                          borderColor: colors.success,
                        },
                        isStart && {
                          borderLeftWidth: 2,
                          borderTopLeftRadius: 6,
                          borderBottomLeftRadius: 6,
                        },
                        isEnd && {
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
  rowIcon: {
    fontSize: 15,
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
  hourLabel: {
    fontSize: 10,
    fontWeight: '500',
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
