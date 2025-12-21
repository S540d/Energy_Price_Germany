import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { fetchEnergyData, getCurrentDataSource } from './services/energyDataManager';
import { RenewableBarChart } from './components/charts/RenewableBarChart';
import { PriceBarChart } from './components/charts/PriceBarChart';
import { CorrelationScatterChart } from './components/charts/CorrelationScatterChart';
import { ChartDetailView } from './components/ChartDetailView';
import { AboutView } from './components/AboutView';
import { calculateMetrics, EnergyData, GRID_FEES_AND_TAXES } from './utils/metrics';
import { getThemeColors, Theme } from './utils/theme';
import { logger } from './utils/logger';

const APP_VERSION = '1.2.2';

type Language = 'en' | 'de';

const translations = {
  en: {
    settings: 'Settings',
    // App Settings Section
    appSettings: 'APP SETTINGS',
    appearance: 'APPEARANCE',
    dark: 'Dark',
    system: 'System',
    language: 'LANGUAGE',
    english: 'English',
    german: 'German',
    // About Section
    about: 'ABOUT',
    version: 'Version',
    dataSource: 'Data Source',
    dataLicense: 'Data License',
    appLicense: 'App License',
    repository: 'GitHub Repository',
    // Support Section
    supportSection: 'SUPPORT',
    supportProject: 'support me',
    rateApp: 'Rate on Play Store',
    reportBug: 'Report a Bug',
    // Other
    loadingData: 'Loading energy data...',
    renewableTitle: 'Share of Renewable Energy in Load',
    priceTitle: 'Market and End Customer Electricity Price',
    correlationTitle: 'Correlation: Price vs. Renewables',
    timeRange: 'Time Range',
    noData: 'No data available',
    noDataMessage: 'The energy data could not be loaded. Please try again later.',
    noCommercialUse: 'No commercial use without permission',
    // Chart labels
    renewablePercent: 'Renewables (%)',
    pricePerKwh: 'Price (¢/kWh)',
    now: 'Now',
    average: 'Avg',
    night: 'Night',
    morningEvening: 'M/E',
    day: 'Day',
    marketPrice: 'Market Price',
    gridFeesAndTaxes: 'Grid Fees & Taxes',
    interpolated: 'Interpolated',
  },
  de: {
    settings: 'Einstellungen',
    // App Settings Section
    appSettings: 'APP-EINSTELLUNGEN',
    appearance: 'ERSCHEINUNGSBILD',
    dark: 'Dunkel',
    system: 'System',
    language: 'SPRACHE',
    english: 'English',
    german: 'Deutsch',
    // About Section
    about: 'ÜBER',
    version: 'Version',
    dataSource: 'Datenquelle',
    dataLicense: 'Daten-Lizenz',
    appLicense: 'App-Lizenz',
    repository: 'GitHub Repository',
    // Support Section
    supportSection: 'UNTERSTÜTZUNG',
    supportProject: 'support me',
    rateApp: 'Im Play Store bewerten',
    reportBug: 'Fehler melden',
    // Other
    loadingData: 'Lade Energiedaten...',
    renewableTitle: 'Anteil Erneuerbarer Energien an der Last',
    priceTitle: 'Börsen- und Endkundenstrompreis',
    correlationTitle: 'Korrelation: Preis vs. Erneuerbare',
    timeRange: 'Zeitraum',
    noData: 'Keine Daten verfügbar',
    noDataMessage: 'Die Energiedaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.',
    noCommercialUse: 'Keine kommerzielle Nutzung ohne Genehmigung',
    // Chart labels
    renewablePercent: 'Erneuerbare (%)',
    pricePerKwh: 'Preis (¢/kWh)',
    now: 'Jetzt',
    average: 'Ø',
    night: 'Nacht',
    morningEvening: 'M/A',
    day: 'Tag',
    marketPrice: 'Börsenstrompreis',
    gridFeesAndTaxes: 'Netzentgelte & Steuern',
    interpolated: 'Interpoliert',
  },
};

function AppContent() {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('system');
  const [language, setLanguage] = useState<Language>('en'); // Will be loaded from storage in useEffect
  const [menuVisible, setMenuVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const systemTheme = useColorScheme();
  const t = translations[language];

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

    return energyData.filter(item => item.timestamp >= past24h);
  }, [energyData]);

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

  // Load language preference on mount
  useEffect(() => {
    async function loadLanguage() {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // Web: Use localStorage
          const saved = window.localStorage?.getItem('language') as Language | null; // platform-safe
          if (saved) {
            setLanguage(saved);
          } else {
            // Auto-detect browser language
            const browserLang = window.navigator?.language?.toLowerCase() || 'en'; // platform-safe
            const detected = browserLang.startsWith('de') ? 'de' : 'en';
            setLanguage(detected);
          }
        } else {
          // Mobile: Use AsyncStorage
          const saved = await AsyncStorage.getItem('language') as Language | null;
          if (saved) {
            setLanguage(saved);
          }
        }
      } catch (e) {
        logger.error('Failed to load language preference:', e);
      }
    }
    loadLanguage();
  }, []);

  // Save language preference when it changes
  useEffect(() => {
    async function saveLanguage() {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // Web: Use localStorage
          window.localStorage?.setItem('language', language); // platform-safe
        } else {
          // Mobile: Use AsyncStorage
          await AsyncStorage.setItem('language', language);
        }
      } catch (e) {
        logger.error('Failed to save language preference:', e);
      }
    }
    saveLanguage();
  }, [language]);

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

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchEnergyData();
        setEnergyData(data);
      } catch (error) {
        logger.error('Failed to load energy data:', error);
        setEnergyData([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
          <Text style={[styles.settingsHeaderButtonText, { color: colors.primary }]}>⋮</Text>
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
                <Text style={[styles.closeButton, { color: colors.text }]}>×</Text>
              </TouchableOpacity>
            </View>

            {/* APP SETTINGS */}
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.appSettings}</Text>

              {/* Appearance */}
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t.appearance}</Text>
              <View style={styles.themeToggle}>
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

              {/* Language */}
              <Text style={[styles.settingLabel, { color: colors.text, marginTop: 12 }]}>{t.language}</Text>
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

            {/* ABOUT BUTTON */}
            <View style={styles.menuSection}>
              <TouchableOpacity
                onPress={() => {
                  setAboutVisible(true);
                  setMenuVisible(false);
                }}
                style={[styles.aboutButton, { backgroundColor: colors.surface, borderColor: colors.gridLine }]}
              >
                <Text style={[styles.aboutButtonText, { color: colors.primary }]}>
                  ℹ️ {t.about}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
            <ChartDetailView
              title={t.renewableTitle}
              colors={colors}
              chartType="renewable"
              metrics={metrics ? {
                min: metrics.renewable.min,
                max: metrics.renewable.max,
                avg: metrics.renewable.avg,
                current: metrics.today?.renewable.current,
                unit: '%',
                label: t.renewablePercent,
              } : undefined}
            >
              <RenewableBarChart
                title={t.renewableTitle}
                subtitle={`${t.timeRange}: ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[0].timestamp) : t.loadingData} - ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[filteredEnergyData.length - 1].timestamp) : t.loadingData}`}
                data={filteredEnergyData}
                backgroundColor={colors.surface}
                textColor={colors.text}
                gridColor={colors.gridLine}
                labels={{
                  yAxis: t.renewablePercent,
                  now: t.now,
                  average: t.average,
                }}
              />
            </ChartDetailView>

            <ChartDetailView
              title={t.priceTitle}
              colors={colors}
              chartType="price"
              metrics={metrics ? {
                min: metrics.marketPrice.min,
                max: metrics.marketPrice.max,
                avg: metrics.marketPrice.avg,
                current: metrics.today?.marketPrice.current,
                unit: '¢',
                label: t.pricePerKwh,
              } : undefined}
            >
              <PriceBarChart
                title={t.priceTitle}
                subtitle={`${t.timeRange}: ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[0].timestamp) : t.loadingData} - ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[filteredEnergyData.length - 1].timestamp) : t.loadingData}`}
                data={filteredEnergyData}
                backgroundColor={colors.surface}
                textColor={colors.text}
                gridColor={colors.gridLine}
                labels={{
                  yAxis: t.pricePerKwh,
                  now: t.now,
                  average: t.average,
                  marketPrice: t.marketPrice,
                  gridFeesAndTaxes: t.gridFeesAndTaxes,
                  interpolated: t.interpolated,
                }}
              />
            </ChartDetailView>

            <ChartDetailView
              title={t.correlationTitle}
              colors={colors}
              chartType="correlation"
              metrics={undefined}
            >
              <CorrelationScatterChart
                title={t.correlationTitle}
                subtitle={`${t.timeRange}: ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[0].timestamp) : t.loadingData} - ${filteredEnergyData.length > 0 ? formatDate(filteredEnergyData[filteredEnergyData.length - 1].timestamp) : t.loadingData}`}
                data={filteredEnergyData}
                backgroundColor={colors.surface}
                textColor={colors.text}
                gridColor={colors.gridLine}
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
});

// Wrap the app with SafeAreaProvider for proper edge-to-edge support on Android 15+
export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AppContent />
    </SafeAreaProvider>
  );
}
