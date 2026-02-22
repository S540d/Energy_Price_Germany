import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ThemeColors } from '../utils/theme';
import { GRID_FEES_AND_TAXES } from '../utils/metrics';
import { useLanguageContext } from '../context/LanguageContext';
import { Button } from './ui/Button';

type MetricsData =
  | {
      // For renewable chart (single value)
      min: number;
      max: number;
      avg: number;
      current?: number | null;
      unit: string;
      label: string;
    }
  | {
      // For price chart (dual values)
      marketPrice: {
        min: number;
        max: number;
        avg: number;
        current?: number | null;
      };
      endCustomerPrice: {
        min: number;
        max: number;
        avg: number;
        current?: number | null;
      };
      unit: string;
      label: string;
    };

interface ChartDetailViewProps {
  children: React.ReactNode;
  /** Optional override for the chart rendered inside the detail modal. */
  detailChildren?: React.ReactNode;
  title: string;
  colors: ThemeColors;
  metrics?: MetricsData;
  chartType: 'renewable' | 'price' | 'correlation';
  viewToggle?: React.ReactNode;
  legend?: React.ReactNode;
  gridFees?: number;
}

export function ChartDetailView({
  children,
  detailChildren,
  title,
  colors,
  metrics,
  chartType,
  viewToggle,
  legend,
  gridFees: _gridFees = GRID_FEES_AND_TAXES,
}: ChartDetailViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguageContext();

  const renderMetricsView = () => {
    if (!metrics) return null;

    // Check if this is price chart (has marketPrice/endCustomerPrice)
    const isPriceChart = 'marketPrice' in metrics && 'endCustomerPrice' in metrics;

    if (isPriceChart) {
      // Detail view always shows end-customer price (priceDisplayMode only affects home screen)
      const data = metrics.endCustomerPrice;
      const accentColor = colors.primary;
      const sectionLabel = t.priceDisplayWithFees;

      return (
        <View style={[styles.metricsContainer, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.metricsTitle, { color: colors.text }]}>{metrics.label}</Text>

          <View style={{ marginTop: 12 }}>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {sectionLabel}
            </Text>

            {data.current !== null && data.current !== undefined && (
              <View
                style={[
                  styles.currentValueContainer,
                  {
                    backgroundColor: colors.surface,
                    borderLeftWidth: 3,
                    borderLeftColor: accentColor,
                  },
                ]}
              >
                <Text style={[styles.currentLabel, { color: colors.text }]}>Aktuell</Text>
                <Text style={[styles.currentValue, { color: accentColor }]}>
                  {data.current.toFixed(2)} {metrics.unit}
                </Text>
              </View>
            )}

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text }]}>Minimum</Text>
                <Text style={[styles.statValue, { color: accentColor }]}>
                  {data.min.toFixed(2)} {metrics.unit}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text }]}>Durchschnitt</Text>
                <Text style={[styles.statValue, { color: accentColor }]}>
                  {data.avg.toFixed(2)} {metrics.unit}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text }]}>Maximum</Text>
                <Text style={[styles.statValue, { color: accentColor }]}>
                  {data.max.toFixed(2)} {metrics.unit}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    // Existing single-value rendering for renewable chart
    return (
      <View style={[styles.metricsContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={[styles.metricsTitle, { color: colors.text }]}>{metrics.label}</Text>

        {/* Current Value if available */}
        {metrics.current !== null && metrics.current !== undefined && (
          <View style={[styles.currentValueContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.currentLabel, { color: colors.text }]}>Aktuell</Text>
            <Text style={[styles.currentValue, { color: colors.primary }]}>
              {metrics.current.toFixed(chartType === 'renewable' ? 1 : 2)} {metrics.unit}
            </Text>
          </View>
        )}

        {/* Min/Max/Avg Values */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text }]}>Minimum</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {metrics.min.toFixed(chartType === 'renewable' ? 1 : 2)} {metrics.unit}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text }]}>Durchschnitt</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {metrics.avg.toFixed(chartType === 'renewable' ? 1 : 2)} {metrics.unit}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text }]}>Maximum</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {metrics.max.toFixed(chartType === 'renewable' ? 1 : 2)} {metrics.unit}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => (
    <View style={{ flex: 1 }}>
      {/* Chart always shown – use detailChildren override when available */}
      <View style={styles.chartContainer}>{detailChildren ?? children}</View>

      {/* Legend - shown below chart */}
      {legend && (
        <View style={[styles.legendContainer, { backgroundColor: colors.surface }]}>{legend}</View>
      )}

      {/* Metrics - always shown below chart/legend when available */}
      {metrics && renderMetricsView()}
    </View>
  );

  return (
    <View>
      {/* Normal view with expand button */}
      <View>
        <View style={styles.headerContainer}>
          <Button
            variant="outlined"
            size="small"
            colors={colors}
            onPress={() => setIsExpanded(true)}
          >
            Details
          </Button>
        </View>
        <View style={styles.chartContainer}>{children}</View>
      </View>

      {/* Expanded detail modal */}
      <Modal visible={isExpanded} animationType="slide" onRequestClose={() => setIsExpanded(false)}>
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          edges={['top', 'bottom']}
        >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              { backgroundColor: colors.surface, borderBottomColor: colors.gridLine },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            {viewToggle && <View style={{ marginTop: 8 }}>{viewToggle}</View>}
          </View>

          {/* Content */}
          <ScrollView style={{ flex: 1 }}>{renderContent()}</ScrollView>

          {/* Close button at bottom */}
          <View
            style={[
              styles.closeButtonContainer,
              { backgroundColor: colors.surface, borderTopColor: colors.gridLine },
            ]}
          >
            <Button
              variant="filled"
              size="large"
              colors={colors}
              onPress={() => setIsExpanded(false)}
              fullWidth
            >
              Schließen
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 100,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  metricsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  currentValueContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  currentLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legendContainer: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
});
