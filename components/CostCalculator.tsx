import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useLanguageContext } from '../context/LanguageContext';
import { getThemeColors } from '../utils/theme';
import { useSettingsContext } from '../context/SettingsContext';

export interface Appliance {
  id: string;
  nameDE: string;
  nameEN: string;
  kwh: number;
  durationHours: number;
  icon: string;
}

// Typische Haushaltsgeräte mit realistischen Verbrauchswerten
export const APPLIANCES: Appliance[] = [
  {
    id: 'washing',
    nameDE: 'Waschmaschine',
    nameEN: 'Washing Machine',
    kwh: 1.5,
    durationHours: 2,
    icon: '🧺'
  },
  {
    id: 'dishwasher',
    nameDE: 'Spülmaschine',
    nameEN: 'Dishwasher',
    kwh: 1.2,
    durationHours: 3,
    icon: '🍽️'
  },
  {
    id: 'dryer',
    nameDE: 'Wäschetrockner',
    nameEN: 'Tumble Dryer',
    kwh: 3.5,
    durationHours: 2,
    icon: '👕'
  },
  {
    id: 'ev_small',
    nameDE: 'E-Auto (10kWh)',
    nameEN: 'EV (10kWh)',
    kwh: 10.0,
    durationHours: 2,
    icon: '🚗'
  },
  {
    id: 'ev_full',
    nameDE: 'E-Auto laden (44kWh)',
    nameEN: 'EV charging (44kWh)',
    kwh: 44.0,
    durationHours: 4,
    icon: '🔋'
  },
  {
    id: 'heat_pump',
    nameDE: 'Wärmepumpe (1h)',
    nameEN: 'Heat Pump (1h)',
    kwh: 3.0,
    durationHours: 1,
    icon: '🌡️'
  },
];

interface CostCalculatorProps {
  currentPrice: number; // in ct/kWh (includes grid fees)
  priceData?: Array<{ start_timestamp: number; marketprice: number; renewable_share?: number }>;
  gridFees?: number; // ct/kWh
}

/**
 * Cost Calculator Component
 * Helps users understand electricity costs in real terms by showing
 * how much it costs to run common household appliances
 */
export function CostCalculator({ currentPrice, priceData = [], gridFees = 0 }: CostCalculatorProps) {
  const { t, language } = useLanguageContext();
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  const [selectedAppliance, setSelectedAppliance] = useState<Appliance>(APPLIANCES[0]);

  // Calculate cost for given kWh and price
  const calculateCost = (kwh: number, priceInCent: number): string => {
    const costInEuro = (kwh * priceInCent) / 100;
    return costInEuro.toFixed(2);
  };

  // Calculate average price over duration for the appliance
  const calculateAveragePriceOverDuration = (startIndex: number, durationHours: number): number => {
    if (!priceData || priceData.length === 0) return 0;

    // Assuming 15-minute intervals in priceData
    const intervalsPerHour = 4; // 4 × 15min = 1 hour
    const requiredIntervals = durationHours * intervalsPerHour;

    // Don't go beyond available data
    const endIndex = Math.min(startIndex + requiredIntervals, priceData.length);
    const actualIntervals = endIndex - startIndex;

    if (actualIntervals === 0) return 0;

    let sum = 0;
    for (let i = startIndex; i < endIndex; i++) {
      // Convert marketprice from EUR/MWh to ct/kWh (1 EUR/MWh = 0.1 ct/kWh)
      const marketPriceCtPerKwh = priceData[i].marketprice * 0.1;
      sum += marketPriceCtPerKwh + gridFees;
    }

    return sum / actualIntervals;
  };

  // Find current average price for the appliance duration
  const currentAveragePrice = useMemo(() => {
    if (!priceData || priceData.length === 0) return currentPrice;

    // Find current time slot (closest to now)
    const now = Date.now();
    let currentIndex = 0;
    let minDiff = Infinity;

    priceData.forEach((item, index) => {
      const diff = Math.abs(item.start_timestamp - now);
      if (diff < minDiff) {
        minDiff = diff;
        currentIndex = index;
      }
    });

    return calculateAveragePriceOverDuration(currentIndex, selectedAppliance.durationHours);
  }, [priceData, currentPrice, selectedAppliance.durationHours, gridFees]);

  // Find the cheapest time slot for the appliance considering its duration
  const findCheapestTimeSlot = useMemo(() => {
    if (!priceData || priceData.length === 0) return null;

    let cheapestAvgPrice = Infinity;
    let cheapestTime = '';
    let cheapestStartIndex = 0;

    // Calculate average price for each possible start time
    priceData.forEach((item, index) => {
      const avgPrice = calculateAveragePriceOverDuration(index, selectedAppliance.durationHours);

      if (avgPrice < cheapestAvgPrice && avgPrice > 0) {
        cheapestAvgPrice = avgPrice;
        cheapestStartIndex = index;
        const date = new Date(item.start_timestamp);
        cheapestTime = date.toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    });

    return { price: cheapestAvgPrice, time: cheapestTime, startIndex: cheapestStartIndex };
  }, [priceData, gridFees, language, selectedAppliance.durationHours]);

  const currentCost = parseFloat(calculateCost(selectedAppliance.kwh, currentAveragePrice));
  const cheapestCost = findCheapestTimeSlot
    ? parseFloat(calculateCost(selectedAppliance.kwh, findCheapestTimeSlot.price))
    : null;
  const savings = cheapestCost !== null ? currentCost - cheapestCost : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t.costCalculatorTitle}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t.costCalculatorSubtitle}
      </Text>

      {/* Appliance Selection Chips */}
      <View style={styles.chipContainer}>
        {APPLIANCES.map((appliance) => {
          const isSelected = selectedAppliance.id === appliance.id;
          return (
            <TouchableOpacity
              key={appliance.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? `${colors.primary}15` // 15% opacity - subtil
                    : 'transparent',
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected
                    ? colors.primary
                    : colors.border,
                }
              ]}
              onPress={() => setSelectedAppliance(appliance)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipIcon}>{appliance.icon}</Text>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? colors.primary : colors.text
                  }
                ]}
              >
                {language === 'de' ? appliance.nameDE : appliance.nameEN}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Current Cost Display */}
      <View style={[styles.resultContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
          {t.costNow}
        </Text>
        <Text style={[styles.resultPrice, { color: colors.text }]}>
          {currentCost.toFixed(2)} €
        </Text>
        <Text style={[styles.subText, { color: colors.textTertiary }]}>
          {t.costFor} {selectedAppliance.durationHours}h {t.costRuntime}
        </Text>
        <Text style={[styles.subText, { color: colors.textTertiary }]}>
          ({t.average} {currentAveragePrice.toFixed(1)} ct/kWh × {selectedAppliance.kwh} kWh)
        </Text>
      </View>

      {/* Cheapest Time Comparison */}
      {findCheapestTimeSlot && cheapestCost !== null && savings !== null && (
        <View style={[styles.savingsContainer, { backgroundColor: colors.infoBackground }]}>
          <Text style={[styles.savingsLabel, { color: colors.infoText }]}>
            💡 {t.costCheapestTime}: {findCheapestTimeSlot.time}
          </Text>
          <Text style={[styles.savingsAmount, { color: colors.infoText }]}>
            {cheapestCost.toFixed(2)} €
            {savings > 0.01 && (
              <Text style={styles.savingsDiff}>
                {' '}({t.costSave} {savings.toFixed(2)} €)
              </Text>
            )}
          </Text>
          {savings > 0.01 && (
            <Text style={[styles.savingsPercent, { color: colors.success }]}>
              ↓ {((savings / currentCost) * 100).toFixed(0)}% {t.costCheaper}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 10,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 4,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultPrice: {
    fontSize: 36,
    fontWeight: '700',
    marginVertical: 4,
  },
  subText: {
    fontSize: 12,
  },
  savingsContainer: {
    padding: 16,
    borderRadius: 12,
    gap: 6,
  },
  savingsLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  savingsAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  savingsDiff: {
    fontSize: 16,
    fontWeight: '600',
  },
  savingsPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
});
