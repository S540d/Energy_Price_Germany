import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { ThemeColors } from '../utils/theme';
import { Metrics } from '../utils/metrics';

interface ChartDetailViewProps {
  children: React.ReactNode;
  title: string;
  colors: ThemeColors;
  metrics?: {
    min: number;
    max: number;
    avg: number;
    current?: number | null;
    unit: string;
    label: string;
  };
  chartType: 'renewable' | 'price' | 'correlation';
  onToggleView?: () => void;
}

export function ChartDetailView({
  children,
  title,
  colors,
  metrics,
  chartType,
  onToggleView,
}: ChartDetailViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  const renderMetricsView = () => {
    if (!metrics) return null;

    return (
      <View style={[styles.metricsContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={[styles.metricsTitle, { color: colors.text }]}>
          {metrics.label}
        </Text>

        {/* Current Value if available */}
        {metrics.current !== null && metrics.current !== undefined && (
          <View style={[styles.currentValueContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.currentLabel, { color: colors.textSecondary }]}>
              Aktuell
            </Text>
            <Text style={[styles.currentValue, { color: colors.primary }]}>
              {metrics.current.toFixed(chartType === 'renewable' ? 1 : 2)} {metrics.unit}
            </Text>
          </View>
        )}

        {/* Min/Max/Avg Values */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Minimum
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {metrics.min.toFixed(chartType === 'renewable' ? 1 : 2)} {metrics.unit}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Durchschnitt
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {metrics.avg.toFixed(chartType === 'renewable' ? 1 : 2)} {metrics.unit}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Maximum
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {metrics.max.toFixed(chartType === 'renewable' ? 1 : 2)} {metrics.unit}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => (
    <View style={{ flex: 1 }}>
      {/* Toggle buttons - only show if metrics are available */}
      {metrics && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              !showMetrics && styles.toggleButtonActive,
              {
                backgroundColor: !showMetrics ? colors.primary : colors.gridLine,
                borderColor: colors.gridLine,
              }
            ]}
            onPress={() => setShowMetrics(false)}
          >
            <Text style={{
              color: !showMetrics ? '#fff' : colors.text,
              fontSize: 12,
              fontWeight: '600'
            }}>
              Grafik
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              showMetrics && styles.toggleButtonActive,
              {
                backgroundColor: showMetrics ? colors.primary : colors.gridLine,
                borderColor: colors.gridLine,
              }
            ]}
            onPress={() => setShowMetrics(true)}
          >
            <Text style={{
              color: showMetrics ? '#fff' : colors.text,
              fontSize: 12,
              fontWeight: '600'
            }}>
              Metrik
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {showMetrics && metrics ? (
        renderMetricsView()
      ) : (
        <View style={styles.chartContainer}>
          {children}
        </View>
      )}
    </View>
  );

  return (
    <View>
      {/* Normal view with expand button */}
      <View>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={[styles.expandButton, { backgroundColor: colors.surface, borderColor: colors.gridLine }]}
            onPress={() => setIsExpanded(true)}
          >
            <Text style={[styles.expandButtonText, { color: colors.primary }]}>
              Details
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chartContainer}>
          {children}
        </View>
      </View>

      {/* Expanded detail modal */}
      <Modal
        visible={isExpanded}
        animationType="slide"
        onRequestClose={() => setIsExpanded(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.gridLine }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={() => setIsExpanded(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>
                × Schließen
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={{ flex: 1 }}>
            {renderContent()}
          </ScrollView>
        </View>
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
    zIndex: 10,
  },
  expandButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleButtonActive: {
    // Active style handled via backgroundColor prop
  },
  metricsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
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
});
