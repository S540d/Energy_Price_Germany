import React from 'react';
import { View, Text } from 'react-native';
import { Metrics } from '../utils/metrics';
import { ThemeColors } from '../utils/theme';

interface MetricsViewProps {
  metrics: Metrics;
  colors: ThemeColors;
}

export function MetricsView({ metrics, colors }: MetricsViewProps) {
  return (
    <View style={{ backgroundColor: colors.surface, margin: 12, padding: 12, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: colors.text }}>
        Metriken
      </Text>

      {/* Zeitraum */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          Zeitraum
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          {new Date(metrics.timeRange.start).toLocaleString('de-DE', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
          {' bis '}
          {new Date(metrics.timeRange.end).toLocaleString('de-DE', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </Text>
      </View>

      {/* Erneuerbare Energien */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          Anteil Erneuerbarer Energien (%)
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Durchschnitt</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {metrics.renewable.avg.toFixed(1)}%
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Minimum</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {metrics.renewable.min.toFixed(1)}%
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Maximum</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {metrics.renewable.max.toFixed(1)}%
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
              {metrics.marketPrice.avg.toFixed(2)} ¢
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Minimum</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {metrics.marketPrice.min.toFixed(2)} ¢
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Maximum</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {metrics.marketPrice.max.toFixed(2)} ¢
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
              {(metrics.marketPrice.avg + 20).toFixed(2)} ¢
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Minimum</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {(metrics.marketPrice.min + 20).toFixed(2)} ¢
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Maximum</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {(metrics.marketPrice.max + 20).toFixed(2)} ¢
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}