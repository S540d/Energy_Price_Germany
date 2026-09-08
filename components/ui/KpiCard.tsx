import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  label: string;
  value: number | null | undefined;
  unit: string;
  avg: number | null | undefined;
  avgLabel: string;
  /**
   * Kleiner Zusatz unter dem Wert – z.B. um kenntlich zu machen, dass hier
   * ausnahmsweise ein Ortswert und kein bundesweiter Wert steht.
   */
  note?: string;
  accentColor: string;
  isDark: boolean;
  surfaceColor: string;
  labelColor: string;
};

function createStyles(bg: string, border: string, labelColor: string, accentColor: string) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: bg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: border,
      padding: 14,
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      color: labelColor,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    value: {
      fontFamily: 'monospace',
      fontSize: 28,
      fontWeight: '700',
      color: accentColor,
      lineHeight: 32,
      marginBottom: 4,
    },
    avg: { fontSize: 11, color: labelColor },
    note: { fontSize: 10, color: labelColor, opacity: 0.85, marginTop: 2 },
  });
}

export function KpiCard({
  label,
  value,
  unit,
  avg,
  avgLabel,
  note,
  accentColor,
  isDark,
  surfaceColor,
  labelColor,
}: Props) {
  const displayValue = value !== null && value !== undefined ? `${value.toFixed(1)}${unit}` : '--';
  const displayAvg = avg !== null && avg !== undefined ? `${avg.toFixed(1)}${unit}` : null;
  const bg = isDark ? 'rgba(255,255,255,0.04)' : surfaceColor;
  const border = accentColor.startsWith('#') ? accentColor + '33' : 'transparent';

  const styles = useMemo(
    () => createStyles(bg, border, labelColor, accentColor),
    [bg, border, labelColor, accentColor]
  );

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{displayValue}</Text>
      {displayAvg && (
        <Text style={styles.avg}>
          {avgLabel} {displayAvg}
        </Text>
      )}
      {note && <Text style={styles.note}>{note}</Text>}
    </View>
  );
}
