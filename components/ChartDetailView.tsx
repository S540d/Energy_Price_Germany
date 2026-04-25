import React, { useRef, useState } from 'react';
import { Alert, Platform, View, Text, Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ThemeColors } from '../utils/theme';
import { GRID_FEES_AND_TAXES } from '../utils/metrics';
import { useLanguageContext } from '../context/LanguageContext';
import { Button } from './ui/Button';
import { shareChart } from '../utils/chartShare';

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
  /** Optional override for the legend rendered inside the detail modal. */
  detailLegend?: React.ReactNode;
  gridFees?: number;
  /** Accent color for the Details button to match chart bars */
  accentColor?: string;
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
  detailLegend,
  gridFees: _gridFees = GRID_FEES_AND_TAXES,
  accentColor,
}: ChartDetailViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const chartCaptureRef = useRef(null);
  const { t } = useLanguageContext();

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await shareChart(chartCaptureRef, title);
    } catch {
      Alert.alert(t.shareChartError);
    } finally {
      setIsSharing(false);
    }
  };

  const renderMetricsView = () => {
    if (!metrics) return null;

    // Check if this is price chart (has marketPrice/endCustomerPrice)
    const isPriceChart = 'marketPrice' in metrics && 'endCustomerPrice' in metrics;

    if (isPriceChart) {
      // Detail view always shows both price sections
      const sections: { data: typeof metrics.marketPrice; accentColor: string; label: string }[] = [
        { data: metrics.marketPrice, accentColor: '#4CAF50', label: t.priceDisplayMarketOnly },
        {
          data: metrics.endCustomerPrice,
          accentColor: colors.primary,
          label: t.priceDisplayWithFees,
        },
      ];

      return (
        <View style={[styles.metricsContainer, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.metricsTitle, { color: colors.text }]}>{metrics.label}</Text>

          {sections.map(({ data, accentColor: sectionAccentColor, label }) => (
            <View key={label} style={{ marginTop: 12 }}>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{label}</Text>

              {data.current !== null && data.current !== undefined && (
                <View
                  style={[
                    styles.currentValueContainer,
                    {
                      backgroundColor: colors.surface,
                      borderLeftWidth: 3,
                      borderLeftColor: sectionAccentColor,
                    },
                  ]}
                >
                  <Text style={[styles.currentLabel, { color: colors.text }]}>
                    {t.metricCurrent}
                  </Text>
                  <Text style={[styles.currentValue, { color: sectionAccentColor }]}>
                    {data.current.toFixed(2)} {metrics.unit}
                  </Text>
                </View>
              )}

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.text }]}>{t.metricMin}</Text>
                  <Text style={[styles.statValue, { color: sectionAccentColor }]}>
                    {data.min.toFixed(2)} {metrics.unit}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.text }]}>{t.metricAvg}</Text>
                  <Text style={[styles.statValue, { color: sectionAccentColor }]}>
                    {data.avg.toFixed(2)} {metrics.unit}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.text }]}>{t.metricMax}</Text>
                  <Text style={[styles.statValue, { color: sectionAccentColor }]}>
                    {data.max.toFixed(2)} {metrics.unit}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      );
    }

    // Existing single-value rendering for renewable chart
    return (
      <View style={[styles.metricsContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={[styles.metricsTitle, { color: colors.text }]}>{metrics.label}</Text>

        {/* Current Value if available */}
        {metrics.current !== null && metrics.current !== undefined && (
          <View
            style={[
              styles.currentValueContainer,
              {
                backgroundColor: colors.surface,
                borderLeftWidth: 3,
                borderLeftColor: accentColor ?? colors.primary,
              },
            ]}
          >
            <Text style={[styles.currentLabel, { color: colors.text }]}>{t.metricCurrent}</Text>
            <Text style={[styles.currentValue, { color: accentColor ?? colors.primary }]}>
              {metrics.current.toFixed(chartType === 'renewable' ? 1 : 2)} {metrics.unit}
            </Text>
          </View>
        )}

        {/* Min/Max/Avg Values */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text }]}>{t.metricMin}</Text>
            <Text style={[styles.statValue, { color: accentColor ?? colors.primary }]}>
              {metrics.min.toFixed(chartType === 'renewable' ? 1 : 2)} {metrics.unit}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text }]}>{t.metricAvg}</Text>
            <Text style={[styles.statValue, { color: accentColor ?? colors.primary }]}>
              {metrics.avg.toFixed(chartType === 'renewable' ? 1 : 2)} {metrics.unit}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text }]}>{t.metricMax}</Text>
            <Text style={[styles.statValue, { color: accentColor ?? colors.primary }]}>
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
      <View ref={chartCaptureRef} style={styles.chartContainer} collapsable={false}>
        {detailChildren ?? children}
      </View>

      {/* Legend - shown below chart, use detailLegend override when available */}
      {(detailLegend ?? legend) && (
        <View style={[styles.legendContainer, { backgroundColor: colors.surface }]}>
          {detailLegend ?? legend}
        </View>
      )}

      {/* Metrics - always shown below chart/legend when available */}
      {metrics && renderMetricsView()}
    </View>
  );

  const detailButtonColors = accentColor
    ? {
        ...colors,
        primary: accentColor,
      }
    : colors;

  return (
    <View>
      {/* Normal view with expand button overlaid on chart */}
      <View style={styles.chartWrapper}>
        <View style={styles.chartContainer}>{children}</View>
        <View style={styles.headerContainer}>
          <Button
            variant="outlined"
            size="small"
            colors={detailButtonColors}
            onPress={() => setIsExpanded(true)}
          >
            Details
          </Button>
        </View>
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

          {/* Footer: Share + Close buttons */}
          <View
            style={[
              styles.closeButtonContainer,
              { backgroundColor: colors.surface, borderTopColor: colors.gridLine },
            ]}
          >
            <View style={styles.footerButtons}>
              <Button
                variant="outlined"
                size="large"
                colors={colors}
                onPress={handleShare}
                disabled={isSharing}
                style={styles.footerButton}
              >
                {isSharing ? t.shareChartSharing : t.shareChart}
              </Button>
              <Button
                variant="filled"
                size="large"
                colors={colors}
                onPress={() => setIsExpanded(false)}
                style={styles.footerButton}
              >
                {t.close}
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrapper: {
    position: 'relative',
  },
  chartContainer: {
    width: '100%',
    justifyContent: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 12,
    right: 19,
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
    elevation: Platform.OS === 'android' ? 0 : 4,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  footerButton: {
    flex: 1,
    minHeight: 48,
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
