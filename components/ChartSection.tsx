import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { RenewableBarChart } from './charts/RenewableBarChart';
import { PriceBarChart } from './charts/PriceBarChart';
import { ClockChart } from './charts/ClockChart';
import { CorrelationScatterChart } from './charts/CorrelationScatterChart';
import { ChartDetailView } from './ChartDetailView';
import { KpiCard } from './ui/KpiCard';
import { isValidPostalCode } from '../utils/postalCodeUtils';
import type { ThemeColors } from '../utils/theme';
import type { EnergyData } from '../utils/metrics';
import type { calculateMetrics } from '../utils/metrics';

type Metrics = ReturnType<typeof calculateMetrics>;

const ACTIVE_VIEW_TOGGLE_TEXT_COLOR = '#fff';

type Props = {
  filteredEnergyData: EnergyData[];
  hourlyEnergyData: EnergyData[];
  metrics: Metrics;
  colors: ThemeColors;
  isDark: boolean;
  debouncedPostalCode: string;
  hasRegionalData: boolean;
  hasLimitedRenewableData: boolean;
  gridFees: number;
  priceDisplayMode: 'marketOnly' | 'withGridFees';
  priceClockView: boolean;
  clockViewAnimatedStyle: AnimatedStyle;
  formatDate: (timestamp: number) => string;
  handlePriceClockViewChange: (value: boolean) => void;
  t: Record<string, string>;
};

export function ChartSection({
  filteredEnergyData,
  hourlyEnergyData,
  metrics,
  colors,
  isDark,
  debouncedPostalCode,
  hasRegionalData,
  hasLimitedRenewableData,
  gridFees,
  priceDisplayMode,
  priceClockView,
  clockViewAnimatedStyle,
  formatDate,
  handlePriceClockViewChange,
  t,
}: Props) {
  const showRegional = isValidPostalCode(debouncedPostalCode) && hasRegionalData;

  const timeRange = (data: EnergyData[]) =>
    data.length > 0
      ? `${t.timeRange}: ${formatDate(data[0].timestamp)} - ${formatDate(data[data.length - 1].timestamp)}`
      : t.loadingData;

  const renewableTitle = showRegional
    ? `${t.renewableTitle} (${t.nationalData} & ${t.regionalData})`
    : t.renewableTitle;

  const renewableLabels = {
    yAxis: t.renewablePercent,
    now: t.now,
    average: t.average,
    regional: t.regionalData,
  };

  const priceLabels = {
    yAxis: t.pricePerKwh,
    now: t.now,
    average: t.average,
    marketPrice: t.marketPrice,
    gridFeesAndTaxes: t.gridFeesAndTaxes,
    interpolated: t.interpolated,
    tooltipMarketPrice: t.tooltipMarketPrice,
    tooltipGridFees: t.tooltipGridFees,
    tooltipEndCustomer: t.tooltipEndCustomer,
  };

  if (filteredEnergyData.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t.noData}</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t.noDataMessage}</Text>
      </View>
    );
  }

  return (
    <>
      {/* KPI Row */}
      <View style={styles.kpiRow}>
        <KpiCard
          label={t.renewableNow}
          value={metrics?.today?.renewable.current}
          unit="%"
          avg={metrics?.today?.renewable.avg}
          avgLabel={t.dailyAvg}
          accentColor={colors.accentGreen}
          isDark={isDark}
          surfaceColor={colors.surface}
          labelColor={colors.textTertiary}
        />
        <KpiCard
          label={t.priceNow}
          value={metrics?.today?.marketPrice.current}
          unit="¢"
          avg={metrics?.today?.marketPrice.avg}
          avgLabel={t.dailyAvg}
          accentColor={colors.accentAmber}
          isDark={isDark}
          surfaceColor={colors.surface}
          labelColor={colors.textTertiary}
        />
      </View>

      {/* Renewable Chart (Issue #417: overlay when today's data is incomplete) */}
      <View style={styles.chartOverlayWrapper}>
        <ChartDetailView
          title={renewableTitle}
          colors={colors}
          chartType="renewable"
          gridFees={gridFees}
          accentColor={colors.accentGreen}
          metrics={
            metrics
              ? {
                  min: metrics.renewable.min,
                  max: metrics.renewable.max,
                  avg: metrics.renewable.avg,
                  current: metrics.today?.renewable.current,
                  unit: '%',
                  label: t.renewablePercent,
                }
              : undefined
          }
          legend={
            showRegional ? (
              <View style={styles.legendContainer}>
                <Text style={[styles.legendTitle, { color: colors.text }]}>{t.legend}</Text>
                <View style={styles.legendRow}>
                  <View style={styles.legendLineRegional} />
                  <Text style={[styles.legendLabel, { color: colors.text }]}>
                    {t.regionalDataLabel}
                  </Text>
                </View>
              </View>
            ) : undefined
          }
          detailChildren={
            <RenewableBarChart
              title={renewableTitle}
              subtitle={timeRange(filteredEnergyData)}
              data={filteredEnergyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
              colors={colors}
              labels={renewableLabels}
              dataKey="renewableShare"
              showRegionalLine={showRegional}
              showLegend={false}
              accentColor={colors.accentGreen}
            />
          }
        >
          <RenewableBarChart
            title={renewableTitle}
            subtitle={timeRange(hourlyEnergyData)}
            data={hourlyEnergyData}
            backgroundColor={colors.surface}
            textColor={colors.text}
            gridColor={colors.gridLine}
            colors={colors}
            labels={renewableLabels}
            dataKey="renewableShare"
            showRegionalLine={showRegional}
            showLegend={false}
            accentColor={colors.accentGreen}
          />
        </ChartDetailView>

        {hasLimitedRenewableData && (
          <View style={styles.limitedDataOverlay} accessibilityRole="alert" pointerEvents="none">
            <View
              style={[
                styles.limitedDataOverlayCard,
                { backgroundColor: colors.warningBackground, borderColor: colors.accentAmber },
              ]}
            >
              <Text style={[styles.limitedDataOverlayText, { color: colors.warningText }]}>
                {t.limitedDataMessage}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Price Chart */}
      <ChartDetailView
        title={t.priceTitle}
        colors={colors}
        chartType="price"
        gridFees={gridFees}
        accentColor={colors.accentAmber}
        metrics={
          metrics
            ? {
                marketPrice: {
                  min: metrics.marketPrice.min,
                  max: metrics.marketPrice.max,
                  avg: metrics.marketPrice.avg,
                  current: metrics.today?.marketPrice.current,
                },
                endCustomerPrice: {
                  min: metrics.marketPrice.min + gridFees,
                  max: metrics.marketPrice.max + gridFees,
                  avg: metrics.marketPrice.avg + gridFees,
                  current:
                    metrics.today?.marketPrice.current != null
                      ? metrics.today.marketPrice.current + gridFees
                      : undefined,
                },
                unit: '¢',
                label: t.pricePerKwh,
              }
            : undefined
        }
        viewToggle={
          <View style={styles.viewToggleRow}>
            <TouchableOpacity
              onPress={() => handlePriceClockViewChange(false)}
              style={[
                styles.viewToggleButton,
                { backgroundColor: !priceClockView ? colors.primary : colors.gridLine },
              ]}
              accessibilityLabel={t.viewBar}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.viewToggleLabel,
                  { color: !priceClockView ? ACTIVE_VIEW_TOGGLE_TEXT_COLOR : colors.text },
                ]}
              >
                {t.viewBar}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handlePriceClockViewChange(true)}
              style={[
                styles.viewToggleButton,
                { backgroundColor: priceClockView ? colors.primary : colors.gridLine },
              ]}
              accessibilityLabel={t.viewClock}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.viewToggleLabel,
                  { color: priceClockView ? ACTIVE_VIEW_TOGGLE_TEXT_COLOR : colors.text },
                ]}
              >
                {t.viewClock}
              </Text>
            </TouchableOpacity>
          </View>
        }
        legend={
          <View style={styles.legendContainer}>
            <Text style={[styles.legendTitle, { color: colors.text }]}>{t.legend}</Text>
            <View style={styles.legendGroup}>
              <View style={styles.legendRow}>
                <View style={styles.legendSquareGreen} />
                <Text style={[styles.legendLabel, { color: colors.text }]}>
                  {t.marketPriceLabel}
                </Text>
              </View>
              {priceDisplayMode === 'withGridFees' && (
                <View style={styles.legendRow}>
                  <View style={styles.legendSquareGray} />
                  <Text style={[styles.legendLabel, { color: colors.text }]}>
                    {t.gridFeesLabel} ({gridFees} ¢/kWh)
                  </Text>
                </View>
              )}
            </View>
          </View>
        }
        detailLegend={
          <View style={styles.legendContainer}>
            <Text style={[styles.legendTitle, { color: colors.text }]}>{t.legend}</Text>
            <View style={styles.legendGroup}>
              <View style={styles.legendRow}>
                <View style={styles.legendSquareGreen} />
                <Text style={[styles.legendLabel, { color: colors.text }]}>
                  {t.marketPriceLabel}
                </Text>
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendSquareGray} />
                <Text style={[styles.legendLabel, { color: colors.text }]}>
                  {t.gridFeesLabel} ({gridFees} ¢/kWh)
                </Text>
              </View>
            </View>
          </View>
        }
        detailChildren={
          priceClockView ? (
            <ClockChart
              data={filteredEnergyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              colors={colors}
              gridFees={gridFees}
              labels={{
                now: t.now,
                average: t.average,
                pricePerKwh: t.pricePerKwh,
                noData: t.noData,
              }}
            />
          ) : (
            <PriceBarChart
              title={t.priceTitle}
              subtitle={timeRange(filteredEnergyData)}
              data={filteredEnergyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
              colors={colors}
              labels={priceLabels}
              gridFees={gridFees}
              showLegend={false}
              forceStacked
              accentColor={colors.accentAmber}
            />
          )
        }
      >
        <Animated.View style={clockViewAnimatedStyle}>
          {priceClockView ? (
            <ClockChart
              data={filteredEnergyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              colors={colors}
              gridFees={gridFees}
              labels={{
                now: t.now,
                average: t.average,
                pricePerKwh: t.pricePerKwh,
                noData: t.noData,
              }}
            />
          ) : (
            <PriceBarChart
              title={t.priceTitle}
              subtitle={timeRange(hourlyEnergyData)}
              data={hourlyEnergyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
              colors={colors}
              labels={priceLabels}
              gridFees={gridFees}
              showLegend={false}
              accentColor={colors.accentAmber}
            />
          )}
        </Animated.View>
      </ChartDetailView>

      {/* Correlation Chart */}
      <CorrelationScatterChart
        title={t.correlationTitle}
        subtitle={timeRange(filteredEnergyData)}
        insightText={t.correlationInsight}
        data={filteredEnergyData}
        backgroundColor={colors.surface}
        textColor={colors.text}
        gridColor={colors.gridLine}
        colors={colors}
        labels={{
          yAxisPrice: t.pricePerKwh,
          xAxisRenewables: t.renewablePercent,
          night: t.night,
          morningEvening: t.morningEvening,
          day: t.day,
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 12,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kpiRow: { flexDirection: 'row', marginHorizontal: 12, marginTop: 12, gap: 8 },
  legendContainer: { gap: 8 },
  legendTitle: { fontSize: 13, fontWeight: '600' },
  legendGroup: { gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendLineRegional: { width: 16, height: 3, backgroundColor: '#FF9800', borderRadius: 1.5 },
  legendSquareGreen: { width: 16, height: 16, backgroundColor: '#4CAF50', borderRadius: 2 },
  legendSquareGray: { width: 16, height: 16, backgroundColor: '#757575', borderRadius: 2 },
  legendLabel: { fontSize: 12 },
  viewToggleRow: { flexDirection: 'row', gap: 6 },
  viewToggleButton: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  viewToggleLabel: { fontSize: 12, fontWeight: '600' },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  chartOverlayWrapper: {
    position: 'relative',
  },
  limitedDataOverlay: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  limitedDataOverlayCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  limitedDataOverlayText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
