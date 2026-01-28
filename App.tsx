import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { getCurrentDataSource } from './services/energyDataManager';
import { RenewableBarChart } from './components/charts/RenewableBarChart';
import { PriceBarChart } from './components/charts/PriceBarChart';
import { CorrelationScatterChart } from './components/charts/CorrelationScatterChart';
import { ChartDetailView } from './components/ChartDetailView';
import { AboutView } from './components/AboutView';
import { SettingsMenu } from './components/settings/SettingsMenu';
import { CustomizeModal } from './components/customize/CustomizeModal';
import { CostCalculator } from './components/CostCalculator';
import { calculateMetrics, EnergyData, GRID_FEES_AND_TAXES } from './utils/metrics';
import { getThemeColors } from './utils/theme';
import { isValidPostalCode } from './utils/postalCodeUtils';
import { useEnergyData } from './hooks/useEnergyData';
import { useLanguageContext } from './context/LanguageContext';
import { useSettingsContext } from './context/SettingsContext';

const APP_VERSION = '1.3.0';

function AppContent() {
  // UI State only (modals)
  const [menuVisible, setMenuVisible] = useState(false);
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);

  // Settings and Language from Context
  const { theme, debouncedPostalCode, gridFees } = useSettingsContext();
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
    const past24h = now - (24 * 60 * 60 * 1000); // 24 hours ago

    const filtered = energyData.filter(item => item.timestamp >= past24h);
    return filtered;
  }, [energyData]);

  // Check if regional data is available
  const hasRegionalData = useMemo(() => {
    return filteredEnergyData.some(item =>
      item.renewableShareRegional !== null &&
      item.renewableShareRegional !== undefined
    );
  }, [filteredEnergyData]);

  // Memoized metrics calculations for better performance
  const metrics = useMemo(() => calculateMetrics(filteredEnergyData), [filteredEnergyData]);

  // Helper function to format date according to selected language
  const formatDate = (timestamp: number) => {
    const locale = language === 'de' ? 'de-DE' : 'en-US';
    return new Date(timestamp).toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const getDataSourceInfo = () => {
    const source = getCurrentDataSource();
    switch (source) {
      case 'energy-charts':
        return {
          name: 'Energy Charts (Fraunhofer ISE)',
          license: 'CC BY 4.0',
          url: 'api.energy-charts.info'
        };
      case 'awattar':
        return {
          name: 'aWATTar (EPEX Spot Market Data)',
          license: 'Proprietary',
          url: 'awattar.at'
        };
      case 'none':
      default:
        return {
          name: 'Mock Data (Demo)',
          license: 'Generated',
          url: 'demo'
        };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar style={colors.background === '#000000' ? 'light' : 'dark'} />
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t.loadingData}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={colors.background === '#000000' ? 'light' : 'dark'} />

      {/* Header with Settings Button */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.gridLine }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Energy Price Germany</Text>
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.settingsHeaderButton}
          aria-label="Settings"
        >
          <Text style={[styles.settingsHeaderButtonText, { color: colors.text }]}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <SettingsMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onOpenCustomize={() => setCustomizeVisible(true)}
        onOpenAbout={() => setAboutVisible(true)}
      />

      {/* Customize Modal */}
      <CustomizeModal
        visible={customizeVisible}
        onClose={() => setCustomizeVisible(false)}
      />

      {/* Main Content */}
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.background, paddingBottom: 20 }}
        bounces={false}
      >
        {filteredEnergyData.length > 0 ? (
          <>
            {/* Renewable Energy Chart - shows national data as bars, regional as dashed line */}
            <ChartDetailView
              title={isValidPostalCode(debouncedPostalCode) && hasRegionalData
                ? `${t.renewableTitle} (${t.nationalData} & ${t.regionalData})`
                : t.renewableTitle}
              colors={colors}
              chartType="renewable"
              gridFees={gridFees}
              metrics={metrics ? {
                min: metrics.renewable.min,
                max: metrics.renewable.max,
                avg: metrics.renewable.avg,
                current: metrics.today?.renewable.current,
                unit: '%',
                label: t.renewablePercent,
              } : undefined}
              legend={
                isValidPostalCode(debouncedPostalCode) && hasRegionalData ? (
                  <View style={{ gap: 8 }}>
                    <Text style={[{ color: colors.text, fontSize: 13, fontWeight: '600' }]}>
                      {t.legend}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{
                        width: 16,
                        height: 3,
                        backgroundColor: '#FF9800',
                        borderRadius: 1.5
                      }} />
                      <Text style={{ color: colors.text, fontSize: 12 }}>
                        {t.regionalDataLabel}
                      </Text>
                    </View>
                  </View>
                ) : undefined
              }
            >
              <RenewableBarChart
                title={isValidPostalCode(debouncedPostalCode) && hasRegionalData
                  ? `${t.renewableTitle} (${t.nationalData} & ${t.regionalData})`
                  : t.renewableTitle}
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
              metrics={metrics ? {
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
              } : undefined}
              legend={
                <View style={{ gap: 8 }}>
                  <Text style={[{ color: colors.text, fontSize: 13, fontWeight: '600' }]}>
                    {t.legend}
                  </Text>
                  <View style={{ gap: 6 }}>
                    {/* Market Price */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{
                        width: 16,
                        height: 16,
                        backgroundColor: '#4CAF50',
                        borderRadius: 2
                      }} />
                      <Text style={{ color: colors.text, fontSize: 12 }}>
                        {t.marketPriceLabel}
                      </Text>
                    </View>

                    {/* Grid Fees */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{
                        width: 16,
                        height: 16,
                        backgroundColor: '#757575',
                        borderRadius: 2
                      }} />
                      <Text style={{ color: colors.text, fontSize: 12 }}>
                        {t.gridFeesLabel} ({GRID_FEES_AND_TAXES} ¢/kWh)
                      </Text>
                    </View>
                  </View>
                </View>
              }
            >
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
                }}
                gridFees={gridFees}
                showLegend={false}
              />
            </ChartDetailView>

            <ChartDetailView
              title={t.correlationTitle}
              colors={colors}
              chartType="correlation"
              gridFees={gridFees}
              metrics={undefined}
              legend={
                <View style={{ gap: 8 }}>
                  <Text style={[{ color: colors.text, fontSize: 13, fontWeight: '600' }]}>
                    {t.legend}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#2196F3' }} />
                      <Text style={{ color: colors.text, fontSize: 12 }}>{t.night}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF9800' }} />
                      <Text style={{ color: colors.text, fontSize: 12 }}>{t.morningEvening}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFEB3B' }} />
                      <Text style={{ color: colors.text, fontSize: 12 }}>{t.day}</Text>
                    </View>
                  </View>
                </View>
              }
            >
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
            </ChartDetailView>

            {/* Cost Calculator - Show real-world electricity costs */}
            <CostCalculator
              currentPrice={metrics?.today?.marketPrice.current ? metrics.today.marketPrice.current + gridFees : gridFees}
              priceData={filteredEnergyData
                .filter(item => item.marketPrice !== null)
                .map(item => ({
                  start_timestamp: item.timestamp,
                  marketprice: item.marketPrice!,
                  renewable_share: item.renewableShare ?? undefined,
                }))}
              gridFees={gridFees}
            />
          </>
        ) : null}
        {filteredEnergyData.length === 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t.noData}
            </Text>
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsHeaderButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
