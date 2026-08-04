import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Metrics } from '../utils/metrics';
import { GRID_FEES_AND_TAXES } from '../utils/metrics';
import type { ThemeColors } from '../utils/theme';

interface MetricsViewProps {
  metrics: Metrics;
  colors: ThemeColors;
}

const BUBBLE_MIN_SIZE = 40;
const BUBBLE_SCALE_FACTOR = 1.2;
const BUBBLE_MIN_RADIUS = 20;
const BUBBLE_RADIUS_FACTOR = 0.6;

function createStyles(colors: ThemeColors, renewableAvg: number) {
  const nonRenewablePercentage = 100 - renewableAvg;

  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      margin: 12,
      padding: 16,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: colors.text },
    subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 16 },
    currentValueBox: {
      marginBottom: 20,
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
    },
    sectionLabel: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    statColumn: { alignItems: 'center' },
    statCaption: { color: colors.textSecondary, fontSize: 11 },
    statValue: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
    section: { marginBottom: 20 },
    bubbleSection: { marginTop: 16, alignItems: 'center' },
    bubbleSectionLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 12 },
    bubbleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
    bubbleColumn: { alignItems: 'center' },
    renewableBubble: {
      width: Math.max(BUBBLE_MIN_SIZE, renewableAvg * BUBBLE_SCALE_FACTOR),
      height: Math.max(BUBBLE_MIN_SIZE, renewableAvg * BUBBLE_SCALE_FACTOR),
      borderRadius: Math.max(BUBBLE_MIN_RADIUS, renewableAvg * BUBBLE_RADIUS_FACTOR),
      backgroundColor: '#4CAF50',
      opacity: 0.8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nonRenewableBubble: {
      width: Math.max(BUBBLE_MIN_SIZE, nonRenewablePercentage * BUBBLE_SCALE_FACTOR),
      height: Math.max(BUBBLE_MIN_SIZE, nonRenewablePercentage * BUBBLE_SCALE_FACTOR),
      borderRadius: Math.max(BUBBLE_MIN_RADIUS, nonRenewablePercentage * BUBBLE_RADIUS_FACTOR),
      backgroundColor: '#9E9E9E',
      opacity: 0.8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bubbleValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    bubbleCaption: { color: colors.textSecondary, fontSize: 10, marginTop: 4 },
  });
}

export function MetricsView({ metrics, colors }: MetricsViewProps) {
  // Use today's metrics if available, otherwise fall back to all-time metrics
  const displayMetrics = metrics.today || {
    date: 'Keine Daten',
    renewable: {
      ...metrics.renewable,
      current: null,
    },
    marketPrice: {
      ...metrics.marketPrice,
      current: null,
    },
    endCustomerPrice: {
      avg: metrics.marketPrice.avg + GRID_FEES_AND_TAXES,
      min: metrics.marketPrice.min + GRID_FEES_AND_TAXES,
      max: metrics.marketPrice.max + GRID_FEES_AND_TAXES,
      current: null,
    },
  };

  const styles = useMemo(
    () => createStyles(colors, displayMetrics.renewable.avg),
    [colors, displayMetrics.renewable.avg]
  );

  const nonRenewablePercentage = 100 - displayMetrics.renewable.avg;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Metriken</Text>
      <Text style={styles.subtitle}>
        {metrics.today ? `Heute (${displayMetrics.date})` : 'Gesamt-Zeitraum'}
      </Text>

      {/* Aktueller Wert (wenn verfügbar) */}
      {displayMetrics.marketPrice.current !== null && (
        <View style={styles.currentValueBox}>
          <Text style={styles.sectionLabel}>Aktuell</Text>
          <View style={styles.statsRow}>
            <View style={styles.statColumn}>
              <Text style={styles.statCaption}>Erneuerbare</Text>
              <Text style={styles.statValue}>
                {displayMetrics.renewable.current !== null
                  ? displayMetrics.renewable.current.toFixed(1)
                  : '—'}
                %
              </Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={styles.statCaption}>Börsenpreis</Text>
              <Text style={styles.statValue}>
                {displayMetrics.marketPrice.current !== null
                  ? displayMetrics.marketPrice.current.toFixed(2)
                  : '—'}{' '}
                ¢
              </Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={styles.statCaption}>Endkunde</Text>
              <Text style={styles.statValue}>
                {displayMetrics.endCustomerPrice.current !== null
                  ? displayMetrics.endCustomerPrice.current.toFixed(2)
                  : '—'}{' '}
                ¢
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Erneuerbare Energien */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Anteil Erneuerbarer Energien (%)</Text>
        <View style={styles.statsRow}>
          <View style={styles.statColumn}>
            <Text style={styles.statCaption}>Durchschnitt</Text>
            <Text style={styles.statValue}>{displayMetrics.renewable.avg.toFixed(1)}%</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statCaption}>Minimum</Text>
            <Text style={styles.statValue}>{displayMetrics.renewable.min.toFixed(1)}%</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statCaption}>Maximum</Text>
            <Text style={styles.statValue}>{displayMetrics.renewable.max.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Energy Mix Visualization - Bubble Chart */}
        <View style={styles.bubbleSection}>
          <Text style={styles.bubbleSectionLabel}>Energiemix (Durchschnitt)</Text>
          <View style={styles.bubbleRow}>
            {/* Renewable bubble */}
            <View style={styles.bubbleColumn}>
              <View style={styles.renewableBubble}>
                <Text style={styles.bubbleValue}>{displayMetrics.renewable.avg.toFixed(0)}%</Text>
              </View>
              <Text style={styles.bubbleCaption}>Erneuerbar</Text>
            </View>

            {/* Non-renewable bubble */}
            <View style={styles.bubbleColumn}>
              <View style={styles.nonRenewableBubble}>
                <Text style={styles.bubbleValue}>{nonRenewablePercentage.toFixed(0)}%</Text>
              </View>
              <Text style={styles.bubbleCaption}>Konventionell</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Börsenstrompreis */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Börsenstrompreis (Cent/kWh)</Text>
        <View style={styles.statsRow}>
          <View style={styles.statColumn}>
            <Text style={styles.statCaption}>Durchschnitt</Text>
            <Text style={styles.statValue}>{displayMetrics.marketPrice.avg.toFixed(2)} ¢</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statCaption}>Minimum</Text>
            <Text style={styles.statValue}>{displayMetrics.marketPrice.min.toFixed(2)} ¢</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statCaption}>Maximum</Text>
            <Text style={styles.statValue}>{displayMetrics.marketPrice.max.toFixed(2)} ¢</Text>
          </View>
        </View>
      </View>

      {/* Endkundenstrompreis (inkl. Netzentgelte) */}
      <View>
        <Text style={styles.sectionLabel}>Endkundenstrompreis (Cent/kWh)</Text>
        <View style={styles.statsRow}>
          <View style={styles.statColumn}>
            <Text style={styles.statCaption}>Durchschnitt</Text>
            <Text style={styles.statValue}>{displayMetrics.endCustomerPrice.avg.toFixed(2)} ¢</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statCaption}>Minimum</Text>
            <Text style={styles.statValue}>{displayMetrics.endCustomerPrice.min.toFixed(2)} ¢</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statCaption}>Maximum</Text>
            <Text style={styles.statValue}>{displayMetrics.endCustomerPrice.max.toFixed(2)} ¢</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
