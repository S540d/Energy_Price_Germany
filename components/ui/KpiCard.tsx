import React from 'react';
import { View, Text } from 'react-native';

type Props = {
  label: string;
  value: number | null | undefined;
  unit: string;
  avg: number | null | undefined;
  avgLabel: string;
  accentColor: string;
  isDark: boolean;
  surfaceColor: string;
  labelColor: string;
};

export function KpiCard({
  label,
  value,
  unit,
  avg,
  avgLabel,
  accentColor,
  isDark,
  surfaceColor,
  labelColor,
}: Props) {
  const displayValue = value !== null && value !== undefined ? `${value.toFixed(1)}${unit}` : '--';
  const displayAvg = avg !== null && avg !== undefined ? `${avg.toFixed(1)}${unit}` : null;
  const bg = isDark ? 'rgba(255,255,255,0.04)' : surfaceColor;
  const border = accentColor.startsWith('#') ? accentColor + '33' : 'transparent';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: border,
        padding: 14,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '600',
          color: labelColor,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'monospace',
          fontSize: 28,
          fontWeight: '700',
          color: accentColor,
          lineHeight: 32,
          marginBottom: 4,
        }}
      >
        {displayValue}
      </Text>
      {displayAvg && (
        <Text style={{ fontSize: 11, color: labelColor }}>
          {avgLabel} {displayAvg}
        </Text>
      )}
    </View>
  );
}
