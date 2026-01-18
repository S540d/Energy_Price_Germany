import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Linking,
  ActivityIndicator,
  TextInput,
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
import { calculateMetrics, EnergyData, GRID_FEES_AND_TAXES } from './utils/metrics';
import { getThemeColors } from './utils/theme';
import { logger } from './utils/logger';
import { isValidPostalCode, sanitizePostalCodeInput } from './utils/postalCodeUtils';
import { translations } from './utils/translations';
import { useEnergyData } from './hooks/useEnergyData';
import { useSettings } from './hooks/useSettings';
import { useLanguageContext } from './context/LanguageContext';
import { useSettingsContext } from './context/SettingsContext';

const APP_VERSION = '1.3.0';

function AppContent() {
  // UI State only (modals)
  const [menuVisible, setMenuVisible] = useState(false);
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);

  // Settings and Language from Context
  const { theme, setTheme, postalCode, setPostalCode, debouncedPostalCode, gridFees, setGridFees } = useSettingsContext();
  const { language, setLanguage, t } = useLanguageContext();

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

    logger.debug('[App] Filtering data. Now:', new Date(now).toISOString());
    logger.debug('[App] Past 24h cutoff:', new Date(past24h).toISOString());
    logger.debug('[App] First data timestamp:', energyData[0] ? new Date(energyData[0].timestamp).toISOString() : 'none');
    logger.debug('[App] Last data timestamp:', energyData[energyData.length - 1] ? new Date(energyData[energyData.length - 1].timestamp).toISOString() : 'none');

    const filtered = energyData.filter(item => item.timestamp >= past24h);
    logger.debug('[App] After filter - filtered data length:', filtered.length);

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
          logger.error('Error checking for updates:', error);
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
      {menuVisible && (
        <>
          <TouchableOpacity
            style={styles.settingsOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View style={[styles.menu, { backgroundColor: colors.surface }]}>
            {/* Header with Close Button */}
            <View style={[styles.menuHeader, { borderBottomColor: colors.gridLine }]}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{t.settings}</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Customize Button */}
            <View style={styles.menuSection}>
              <TouchableOpacity
                style={[
                  styles.customizeButton,
                  { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => {
                  setCustomizeVisible(true);
                  setMenuVisible(false);
                }}
              >
                <Text style={[styles.customizeButtonText, { color: '#fff' }]}>{t.customize}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

            {/* APPEARANCE Section */}
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.appearance}</Text>
              <View style={styles.themeToggle}>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    theme === 'light' && styles.themeButtonActive,
                    { backgroundColor: theme === 'light' ? colors.primary : colors.gridLine }
                  ]}
                  onPress={() => setTheme('light')}
                >
                  <Text style={{ color: theme === 'light' ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{t.light}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    theme === 'dark' && styles.themeButtonActive,
                    { backgroundColor: theme === 'dark' ? colors.primary : colors.gridLine }
                  ]}
                  onPress={() => setTheme('dark')}
                >
                  <Text style={{ color: theme === 'dark' ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{t.dark}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    theme === 'system' && styles.themeButtonActive,
                    { backgroundColor: theme === 'system' ? colors.primary : colors.gridLine }
                  ]}
                  onPress={() => setTheme('system')}
                >
                  <Text style={{ color: theme === 'system' ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{t.system}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

            {/* LANGUAGE Section */}
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.language}</Text>
              <View style={styles.themeToggle}>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    language === 'en' && styles.themeButtonActive,
                    { backgroundColor: language === 'en' ? colors.primary : colors.gridLine }
                  ]}
                  onPress={() => setLanguage('en')}
                >
                  <Text style={{ color: language === 'en' ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{t.english}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    language === 'de' && styles.themeButtonActive,
                    { backgroundColor: language === 'de' ? colors.primary : colors.gridLine }
                  ]}
                  onPress={() => setLanguage('de')}
                >
                  <Text style={{ color: language === 'de' ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{t.german}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

            {/* FEEDBACK, SUPPORT & ABOUT - Three Links in One Row */}
            <View style={[styles.menuSection, styles.menuSectionRow]}>
              <TouchableOpacity
                style={styles.menuLinkFlex}
                onPress={() => {
                  Linking.openURL('mailto:devsven@posteo.de?subject=Energy Price Germany Feedback');
                  setMenuVisible(false);
                }}
              >
                <Text style={[styles.menuLinkText, { color: colors.primary }]}>{t.feedback}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuLinkFlex}
                onPress={() => {
                  Linking.openURL('https://ko-fi.com/devsven');
                  setMenuVisible(false);
                }}
              >
                <Text style={[styles.menuLinkText, { color: colors.primary }]}>{t.supportProject}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuLinkFlex}
                onPress={() => {
                  setAboutVisible(true);
                  setMenuVisible(false);
                }}
              >
                <Text style={[styles.menuLinkText, { color: colors.primary }]}>{t.about}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Customize Modal */}
      {customizeVisible && (
        <>
          <TouchableOpacity
            style={styles.settingsOverlay}
            activeOpacity={1}
            onPress={() => setCustomizeVisible(false)}
          />
          <ScrollView style={[styles.menu, { backgroundColor: colors.surface }]}>
            {/* Header with Close Button */}
            <View style={[styles.menuHeader, { borderBottomColor: colors.gridLine }]}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{t.customize}</Text>
              <TouchableOpacity onPress={() => setCustomizeVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* LANGUAGE Section */}
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.language}</Text>
              <View style={styles.themeToggle}>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    language === 'en' && styles.themeButtonActive,
                    { backgroundColor: language === 'en' ? colors.primary : colors.gridLine }
                  ]}
                  onPress={() => setLanguage('en')}
                >
                  <Text style={{ color: language === 'en' ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{t.english}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    language === 'de' && styles.themeButtonActive,
                    { backgroundColor: language === 'de' ? colors.primary : colors.gridLine }
                  ]}
                  onPress={() => setLanguage('de')}
                >
                  <Text style={{ color: language === 'de' ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>{t.german}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

            {/* POSTAL CODE Section */}
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.region}</Text>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
                  {t.postalCodeHint}
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.gridLine,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                  }}
                  placeholder={t.postalCode}
                  placeholderTextColor={colors.textSecondary}
                  value={postalCode}
                  onChangeText={(text) => {
                    setPostalCode(sanitizePostalCodeInput(text));
                  }}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

            {/* GRID FEES Section */}
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.gridFees}</Text>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
                  {t.gridFeesHint}
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.gridLine,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                  }}
                  placeholder={t.gridFeesValue}
                  placeholderTextColor={colors.textSecondary}
                  value={gridFees.toString()}
                  onChangeText={(text) => {
                    // Allow only numbers and decimal point
                    const sanitized = text.replace(/[^0-9.]/g, '');
                    
                    // If empty, keep current value (don't update state)
                    if (sanitized === '') {
                      return;
                    }
                    
                    const value = parseFloat(sanitized);
                    if (!isNaN(value) && value > 0) {
                      setGridFees(value);
                    }
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>
        </>
      )}

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
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 4,
  },
  menuItem: {
    padding: 16,
  },
  menuItemFlex: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  menuSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  themeToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  themeButtonActive: {
    // Additional styling for active state if needed
  },
  customizeButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  customizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  separator: {
    height: 1,
    marginVertical: 4,
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
  menuSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  menuLink: {
    paddingVertical: 8,
  },
  menuLinkFlex: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  menuLinkText: {
    fontSize: 14,
    fontWeight: '600',
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
