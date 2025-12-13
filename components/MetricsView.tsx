import React from 'react';
import { View, Text } from 'react-native';
import { Metrics } from '../utils/metrics';
import { ThemeColors } from '../utils/theme';

interface MetricsViewProps {
  metrics: Metrics;
  colors: ThemeColors;
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
      avg: metrics.marketPrice.avg + 20,
      min: metrics.marketPrice.min + 20,
      max: metrics.marketPrice.max + 20,
      current: null,
    },
  };

  return (
    <View style={{ backgroundColor: colors.surface, margin: 12, padding: 16, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: colors.text }}>
        Metriken
      </Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
        {metrics.today ? `Heute (${displayMetrics.date})` : 'Gesamt-Zeitraum'}
      </Text>

      {/* Aktueller Wert (wenn verfügbar) */}
      {displayMetrics.marketPrice.current !== null && (
        <View style={{ marginBottom: 20, padding: 12, backgroundColor: colors.background, borderRadius: 8 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
            Aktuell
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Erneuerbare</Text>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                {displayMetrics.renewable.current !== null ? displayMetrics.renewable.current.toFixed(1) : '—'}%
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Börsenpreis</Text>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                {displayMetrics.marketPrice.current !== null ? displayMetrics.marketPrice.current.toFixed(2) : '—'} ¢
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Endkunde</Text>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                {displayMetrics.endCustomerPrice.current !== null ? displayMetrics.endCustomerPrice.current.toFixed(2) : '—'} ¢
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Erneuerbare Energien */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          Anteil Erneuerbarer Energien (%)
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Durchschnitt</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {displayMetrics.renewable.avg.toFixed(1)}%
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Minimum</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {displayMetrics.renewable.min.toFixed(1)}%
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Maximum</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {displayMetrics.renewable.max.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Börsenstrompreis */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          Börsenstrompreis (Cent/kWh)
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Durchschnitt</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {displayMetrics.marketPrice.avg.toFixed(2)} ¢
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Minimum</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {displayMetrics.marketPrice.min.toFixed(2)} ¢
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Maximum</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {displayMetrics.marketPrice.max.toFixed(2)} ¢
            </Text>
          </View>
        </View>
      </View>

      {/* Endkundenstrompreis (inkl. Netzentgelte) */}
      <View>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          Endkundenstrompreis (Cent/kWh)
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Durchschnitt</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {displayMetrics.endCustomerPrice.avg.toFixed(2)} ¢
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Minimum</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {displayMetrics.endCustomerPrice.min.toFixed(2)} ¢
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Maximum</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {displayMetrics.endCustomerPrice.max.toFixed(2)} ¢
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}