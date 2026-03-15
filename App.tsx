import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { getCurrentDataSource } from './services/energyDataManager';
import { RenewableBarChart } from './components/charts/RenewableBarChart';
import { PriceBarChart } from './components/charts/PriceBarChart';
import { ClockChart } from './components/charts/ClockChart';
import { CorrelationScatterChart } from './components/charts/CorrelationScatterChart';
import { ChartDetailView } from './components/ChartDetailView';
import { AboutView } from './components/AboutView';
import { SettingsMenu } from './components/settings/SettingsMenu';
import { CustomizeModal } from './components/customize/CustomizeModal';
import { CostCalculatorView } from './components/CostCalculatorView';
import { calculateMetrics } from './utils/metrics';
import { getThemeColors } from './utils/theme';
import { isValidPostalCode } from './utils/postalCodeUtils';
import { useEnergyData } from './hooks/useEnergyData';
import { useLanguageContext } from './context/LanguageContext';
import { useSettingsContext } from './context/SettingsContext';
import { checkPriceAlert } from './utils/priceAlertUtils';
import { usePriceAlertNotification } from './hooks/usePriceAlertNotification';
import { ChartSkeleton } from './components/ui/ChartSkeleton';
import { Badge } from './components/ui/Badge';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const APP_VERSION = '1.5.2';

function AppContent() {
  // UI State only (modals)
  const [menuVisible, setMenuVisible] = useState(false);
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [priceClockView, setPriceClockView] = useState(false);
  const clockViewOpacity = useSharedValue(1);
  const isAnimatingClockView = useRef(false);

  const handlePriceClockViewChange = useCallback(
    (newValue: boolean) => {
      if (isAnimatingClockView.current || newValue === priceClockView) return;
      isAnimatingClockView.current = true;
      clockViewOpacity.value = withTiming(0, { duration: 120 }, () => {
        runOnJS(setPriceClockView)(newValue);
        clockViewOpacity.value = withTiming(1, { duration: 200 }, () => {
          runOnJS(() => {
            isAnimatingClockView.current = false;
          })();
        });
      });
    },
    [priceClockView, clockViewOpacity]
  );

  const clockViewAnimatedStyle = useAnimatedStyle(() => ({
    opacity: clockViewOpacity.value,
  }));

  // Settings and Language from Context
  const { theme, debouncedPostalCode, gridFees, priceAlertLow, priceAlertHigh, priceDisplayMode } =
    useSettingsContext();
  const { language, t } = useLanguageContext();

  // Energy data from hook
  const { energyData, loading } = useEnergyData(debouncedPostalCode);

  const systemTheme = useColorScheme();

  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  // Set body background color dynamically on web
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = colors.background;
    }
  }, [colors.background]);

  // Filter data to show only 24h of past and all future data
  const filteredEnergyData = useMemo(() => {
    if (!energyData.length) return energyData;

    const now = Date.now();
    const past24h = now - 24 * 60 * 60 * 1000; // 24 hours ago

    const filtered = energyData.filter(item => item.timestamp >= past24h);
    return filtered;
  }, [energyData]);

  // Check if regional data is available
  const hasRegionalData = useMemo(() => {
    return filteredEnergyData.some(
      item => item.renewableShareRegional !== null && item.renewableShareRegional !== undefined
    );
  }, [filteredEnergyData]);

  // Memoized metrics calculations for better performance
  const metrics = useMemo(() => calculateMetrics(filteredEnergyData), [filteredEnergyData]);

  // Price alert state based on current end-customer price
  const alertState = useMemo(
    () =>
      checkPriceAlert(
        metrics?.today?.endCustomerPrice?.current ?? null,
        priceAlertLow,
        priceAlertHigh
      ),
    [metrics, priceAlertLow, priceAlertHigh]
  );

  // Web Notification when alert state changes (foreground only)
  usePriceAlertNotification(
    alertState,
    t.priceAlertNotificationTitle,
    t.priceAlertNotificationLow,
    t.priceAlertNotificationHigh
  );

  // Performance: Memoized date formatter to prevent unnecessary recalculations
  // Only recreates when language changes
  const formatDate = useCallback(
    (timestamp: number) => {
      const locale = language === 'de' ? 'de-DE' : 'en-US';
      return new Date(timestamp).toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    [language]
  );

  // Language, postal code, and grid fees are now managed by hooks and contexts!

  // Check for app updates
  // Note: Channel selection (staging/production) is handled by BetaModeSection
  // When user toggles beta mode, they are prompted to restart the app
  useEffect(() => {
    async function checkAndApplyUpdates() {
      if (!__DEV__) {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        } catch (error) {
          // Silently fail - app will continue to work with current version
        }
      }
    }

    checkAndApplyUpdates();
  }, []);

  // Data loading is now managed by useEnergyData hook!
  // Postal code debouncing is now managed by useSettings hook!

  // Performance: Memoized data source info to prevent unnecessary recalculations
  const getDataSourceInfo = useCallback(() => {
    const source = getCurrentDataSource();
    switch (source) {
      case 'energy-charts':
        return {
          name: 'Energy Charts (Fraunhofer ISE)',
          license: 'CC BY 4.0',
          url: 'api.energy-charts.info',
        };
      case 'awattar':
        return {
          name: 'aWATTar (EPEX Spot Market Data)',
          license: 'Proprietary',
          url: 'awattar.at',
        };
      case 'none':
      default:
        return {
          name: 'Mock Data (Demo)',
          license: 'Generated',
          url: 'demo',
        };
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar style={colors.background === '#000000' ? 'light' : 'dark'} />
        <ScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={styles.skeletonScroll}
          scrollEnabled={false}
        >
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={styles.skeletonA11yText}
          >
            {t.loadingData}
          </Text>
          <ChartSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={colors.background === '#000000' ? 'light' : 'dark'} />

      {/* Header with Calculator and Settings Buttons */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.gridLine },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Energy Price Germany</Text>
        <View style={styles.headerButtons}>
          {alertState !== 'none' && (
            <Badge
              label={alertState === 'low' ? '↓' : '↑'}
              backgroundColor={alertState === 'low' ? colors.success : colors.error}
              accessibilityLabel={
                alertState === 'low' ? t.priceAlertActiveLow : t.priceAlertActiveHigh
              }
            />
          )}
          <TouchableOpacity
            onPress={() => setCalculatorVisible(true)}
            style={[
              styles.headerButton,
              { borderColor: colors.gridLine, backgroundColor: colors.background },
            ]}
            aria-label="Cost Calculator"
          >
            <Text style={[styles.headerButtonText, { color: colors.text }]}>€</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={[
              styles.headerButton,
              { borderColor: colors.gridLine, backgroundColor: colors.background },
            ]}
            aria-label="Settings"
          >
            <Text style={[styles.settingsHeaderButtonText, { color: colors.text }]}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Modal */}
      <SettingsMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onOpenCustomize={() => setCustomizeVisible(true)}
        onOpenAbout={() => setAboutVisible(true)}
      />

      {/* Customize Modal */}
      <CustomizeModal visible={customizeVisible} onClose={() => setCustomizeVisible(false)} />

      {/* Main Content */}
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: colors.background,
          paddingBottom: 20,
        }}
        bounces={false}
      >
        {filteredEnergyData.length > 0 ? (
          <>
            {/* Renewable Energy Chart - shows national data as bars, regional as dashed line */}
            <ChartDetailView
              title={
                isValidPostalCode(debouncedPostalCode) && hasRegionalData
                  ? `${t.renewableTitle} (${t.nationalData} & ${t.regionalData})`
                  : t.renewableTitle
              }
              colors={colors}
              chartType="renewable"
              gridFees={gridFees}
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
                isValidPostalCode(debouncedPostalCode) && hasRegionalData ? (
                  <View style={{ gap: 8 }}>
                    <Text style={[{ color: colors.text, fontSize: 13, fontWeight: '600' }]}>
                      {t.legend}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View
                        style={{
                          width: 16,
                          height: 3,
                          backgroundColor: '#FF9800',
                          borderRadius: 1.5,
                        }}
                      />
                      <Text style={{ color: colors.text, fontSize: 12 }}>
                        {t.regionalDataLabel}
                      </Text>
                    </View>
                  </View>
                ) : undefined
              }
            >
              <RenewableBarChart
                title={
                  isValidPostalCode(debouncedPostalCode) && hasRegionalData
                    ? `${t.renewableTitle} (${t.nationalData} & ${t.regionalData})`
                    : t.renewableTitle
                }
                subtitle={`${t.timeRange}: ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[0].timestamp) : t.loadingData} - ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[filteredEnergyData.length - 1].timestamp) : t.loadingData}`}
                data={filteredEnergyData}
                backgroundColor={colors.surface}
                textColor={colors.text}
                gridColor={colors.gridLine}
                colors={colors}
                labels={{
                  yAxis: t.renewablePercent,
                  now: t.now,
                  average: t.average,
                  regional: t.regionalData,
                }}
                dataKey="renewableShare"
                showRegionalLine={isValidPostalCode(debouncedPostalCode) && hasRegionalData}
                showLegend={false}
              />
            </ChartDetailView>

            <ChartDetailView
              title={t.priceTitle}
              colors={colors}
              chartType="price"
              gridFees={gridFees}
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
                        current: metrics.today?.marketPrice.current
                          ? metrics.today.marketPrice.current + gridFees
                          : undefined,
                      },
                      unit: '¢',
                      label: t.pricePerKwh,
                    }
                  : undefined
              }
              viewToggle={
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => handlePriceClockViewChange(false)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: !priceClockView ? colors.primary : colors.gridLine,
                    }}
                    accessibilityLabel={t.viewBar}
                    accessibilityRole="button"
                  >
                    <Text
                      style={{
                        color: !priceClockView ? '#fff' : colors.text,
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {t.viewBar}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handlePriceClockViewChange(true)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: priceClockView ? colors.primary : colors.gridLine,
                    }}
                    accessibilityLabel={t.viewClock}
                    accessibilityRole="button"
                  >
                    <Text
                      style={{
                        color: priceClockView ? '#fff' : colors.text,
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {t.viewClock}
                    </Text>
                  </TouchableOpacity>
                </View>
              }
              legend={
                <View style={{ gap: 8 }}>
                  <Text style={[{ color: colors.text, fontSize: 13, fontWeight: '600' }]}>
                    {t.legend}
                  </Text>
                  <View style={{ gap: 6 }}>
                    {/* Market Price */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          backgroundColor: '#4CAF50',
                          borderRadius: 2,
                        }}
                      />
                      <Text style={{ color: colors.text, fontSize: 12 }}>{t.marketPriceLabel}</Text>
                    </View>

                    {/* Grid Fees – only shown in end-customer price mode */}
                    {priceDisplayMode === 'withGridFees' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                          style={{
                            width: 16,
                            height: 16,
                            backgroundColor: '#757575',
                            borderRadius: 2,
                          }}
                        />
                        <Text style={{ color: colors.text, fontSize: 12 }}>
                          {t.gridFeesLabel} ({gridFees} ¢/kWh)
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              }
              detailLegend={
                <View style={{ gap: 8 }}>
                  <Text style={[{ color: colors.text, fontSize: 13, fontWeight: '600' }]}>
                    {t.legend}
                  </Text>
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          backgroundColor: '#4CAF50',
                          borderRadius: 2,
                        }}
                      />
                      <Text style={{ color: colors.text, fontSize: 12 }}>{t.marketPriceLabel}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          backgroundColor: '#757575',
                          borderRadius: 2,
                        }}
                      />
                      <Text style={{ color: colors.text, fontSize: 12 }}>
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
                    subtitle={`${t.timeRange}: ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[0].timestamp) : t.loadingData} - ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[filteredEnergyData.length - 1].timestamp) : t.loadingData}`}
                    data={filteredEnergyData}
                    backgroundColor={colors.surface}
                    textColor={colors.text}
                    gridColor={colors.gridLine}
                    colors={colors}
                    labels={{
                      yAxis: t.pricePerKwh,
                      now: t.now,
                      average: t.average,
                      marketPrice: t.marketPrice,
                      gridFeesAndTaxes: t.gridFeesAndTaxes,
                      interpolated: t.interpolated,
                      tooltipMarketPrice: t.tooltipMarketPrice,
                      tooltipGridFees: t.tooltipGridFees,
                      tooltipEndCustomer: t.tooltipEndCustomer,
                    }}
                    gridFees={gridFees}
                    showLegend={false}
                    forceStacked
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
                    subtitle={`${t.timeRange}: ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[0].timestamp) : t.loadingData} - ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[filteredEnergyData.length - 1].timestamp) : t.loadingData}`}
                    data={filteredEnergyData}
                    backgroundColor={colors.surface}
                    textColor={colors.text}
                    gridColor={colors.gridLine}
                    colors={colors}
                    labels={{
                      yAxis: t.pricePerKwh,
                      now: t.now,
                      average: t.average,
                      marketPrice: t.marketPrice,
                      gridFeesAndTaxes: t.gridFeesAndTaxes,
                      interpolated: t.interpolated,
                      tooltipMarketPrice: t.tooltipMarketPrice,
                      tooltipGridFees: t.tooltipGridFees,
                      tooltipEndCustomer: t.tooltipEndCustomer,
                    }}
                    gridFees={gridFees}
                    showLegend={false}
                  />
                )}
              </Animated.View>
            </ChartDetailView>

            <CorrelationScatterChart
              title={t.correlationTitle}
              subtitle={`${t.timeRange}: ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[0].timestamp) : t.loadingData} - ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[filteredEnergyData.length - 1].timestamp) : t.loadingData}`}
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
        ) : null}
        {filteredEnergyData.length === 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t.noData}</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {t.noDataMessage}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* About View Modal */}
      <AboutView
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
        colors={colors}
        translations={t}
        appVersion={APP_VERSION}
        dataSourceInfo={getDataSourceInfo()}
      />

      {/* Cost Calculator View */}
      <CostCalculatorView
        visible={calculatorVisible}
        onClose={() => setCalculatorVisible(false)}
        priceData={filteredEnergyData
          .filter(item => item.marketPrice !== null)
          .map(item => ({
            start_timestamp: item.timestamp,
            marketprice: item.marketPrice ?? 0,
            renewable_share: item.renewableShare ?? undefined,
          }))}
        gridFees={gridFees}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonScroll: {
    flexGrow: 1,
  },
  skeletonA11yText: {
    // Visually hidden but announced by screen readers
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
  settingsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  menu: {
    position: 'absolute',
    top: '10%',
    left: '50%',
    maxHeight: '80%',
    width: '80%',
    maxWidth: 400,
    transform: [{ translateX: '-50%' }],
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 12,
    height: 12,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
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
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  headerButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  settingsHeaderButtonText: {
    fontSize: 24,
    fontWeight: '500',
  },
  aboutButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  aboutButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  aboutInfoText: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 4,
    lineHeight: 1.5,
  },
});

// Wrap the app with SafeAreaProvider and Context Providers
import { SettingsProvider } from './context/SettingsContext';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <LanguageProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
