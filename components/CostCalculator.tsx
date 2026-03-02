import React, { useMemo } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { getThemeColors } from '../utils/theme';
import { useSettingsContext } from '../context/SettingsContext';
import { ApplianceTimeline } from './ApplianceTimeline';

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
    icon: '🧺',
  },
  {
    id: 'dishwasher',
    nameDE: 'Spülmaschine',
    nameEN: 'Dishwasher',
    kwh: 1.2,
    durationHours: 3,
    icon: '🍽️',
  },
  {
    id: 'dryer',
    nameDE: 'Wäschetrockner',
    nameEN: 'Tumble Dryer',
    kwh: 3.5,
    durationHours: 2,
    icon: '👕',
  },
  {
    id: 'ev_small',
    nameDE: 'E-Auto (10kWh)',
    nameEN: 'EV (10kWh)',
    kwh: 10.0,
    durationHours: 2,
    icon: '🚗',
  },
  {
    id: 'ev_full',
    nameDE: 'E-Auto laden (44kWh)',
    nameEN: 'EV charging (44kWh)',
    kwh: 44.0,
    durationHours: 4,
    icon: '🔋',
  },
  {
    id: 'heat_pump',
    nameDE: 'Wärmepumpe (1h)',
    nameEN: 'Heat Pump (1h)',
    kwh: 3.0,
    durationHours: 1,
    icon: '🌡️',
  },
];

interface CostCalculatorProps {
  currentPrice: number; // in ct/kWh (includes grid fees)
  priceData?: Array<{ start_timestamp: number; marketprice: number; renewable_share?: number }>;
  gridFees?: number; // ct/kWh
}

/**
 * Cost Calculator Component
 * Shows a timeline of the best hours to run each household appliance.
 */
export function CostCalculator({ priceData = [], gridFees = 0 }: CostCalculatorProps) {
  const { theme } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {priceData.length > 0 && (
        <ApplianceTimeline appliances={APPLIANCES} priceData={priceData} gridFees={gridFees} />
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
});
