import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  useColorScheme,
  Platform,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator } from 'react-native';
import { fetchEnergyData, getCurrentDataSource } from './services/energyDataManager';
import { RenewableBarChart } from './components/charts/RenewableBarChart';
import { PriceBarChart } from './components/charts/PriceBarChart';
import { CorrelationScatterChart } from './components/charts/CorrelationScatterChart';
import { MetricsView } from './components/MetricsView';
import { calculateMetrics, EnergyData } from './utils/metrics';
import { getThemeColors, Theme } from './utils/theme';

const APP_VERSION = '1.0.5';

type ViewMode = 'charts' | 'metrics';
type Language = 'en' | 'de';

const translations = {
  en: {
    settings: 'Settings',
    appearance: 'APPEARANCE',
    dark: 'Dark',
    system: 'System',
    language: 'LANGUAGE',
    english: 'English',
    german: 'German',
    feedback: 'Send Feedback',
    support: 'Buy Me a Coffee',
    about: 'ABOUT',
    version: 'Version',
    dataSource: 'Data Source',
    dataLicense: 'Data License',
    appLicense: 'App License',
    loadingData: 'Loading energy data...',
    backToCharts: '← Back to Charts',
    renewableTitle: 'Share of Renewable Energy in Load',
    priceTitle: 'Market and End Customer Electricity Price',
    correlationTitle: 'Correlation: Price vs. Renewables',
    timeRange: 'Time Range',
    noData: 'No data available',
    noDataMessage: 'The energy data could not be loaded. Please try again later.',
    // Chart labels
    renewablePercent: 'Renewables (%)',
    pricePerKwh: 'Price (¢/kWh)',
    now: 'Now',
    average: 'Avg',
    night: 'Night',
    morningEvening: 'M/E',
    day: 'Day',
  },
  de: {
    settings: 'Einstellungen',
    appearance: 'ERSCHEINUNGSBILD',
    dark: 'Dunkel',
    system: 'System',
    language: 'SPRACHE',
    english: 'English',
    german: 'Deutsch',
    feedback: 'Feedback senden',
    support: 'Buy Me a Coffee',
    about: 'ÜBER',
    version: 'Version',
    dataSource: 'Datenquelle',
    dataLicense: 'Daten-Lizenz',
    appLicense: 'App-Lizenz',
    loadingData: 'Lade Energiedaten...',
    backToCharts: '← Zurück zu Diagrammen',
    renewableTitle: 'Anteil Erneuerbarer Energien an der Last',
    priceTitle: 'Börsen- und Endkundenstrompreis',
    correlationTitle: 'Korrelation: Preis vs. Erneuerbare',
    timeRange: 'Zeitraum',
    noData: 'Keine Daten verfügbar',
    noDataMessage: 'Die Energiedaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.',
    // Chart labels
    renewablePercent: 'Erneuerbare (%)',
    pricePerKwh: 'Preis (¢/kWh)',
    now: 'Jetzt',
    average: 'Ø',
    night: 'Nacht',
    morningEvening: 'M/A',
    day: 'Tag',
  },
};

export default function App() {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('system');
  const [language, setLanguage] = useState<Language>(() => {
    // Load saved language preference or detect browser language
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const saved = window.localStorage?.getItem('language') as Language | null;
        if (saved) return saved;
        // Auto-detect browser language
        const browserLang = window.navigator?.language?.toLowerCase() || 'en';
        return browserLang.startsWith('de') ? 'de' : 'en';
      } catch (e) {
        return 'en';
      }
    }
    return 'en';
  });
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('charts');
  const systemTheme = useColorScheme();
  const t = translations[language];

  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  // Memoized metrics calculations for better performance
  const metrics = useMemo(() => calculateMetrics(energyData), [energyData]);

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

  // Save language preference when it changes
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem('language', language);
      } catch (e) {
        console.error('Failed to save language preference:', e);
      }
    }
  }, [language]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchEnergyData();
        setEnergyData(data);
      } catch (error) {
        console.error('Failed to load energy data:', error);
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colors.background === '#121212' ? 'light' : 'dark'} />
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.background === '#121212' ? 'light' : 'dark'} />

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

            {/* Appearance Settings - Dark/System Only */}
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.appearance}</Text>
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
            </View>

            <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

            {/* Language Settings */}
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

            {/* Feedback and Support in One Row */}
            <View style={[styles.menuSection, styles.menuSectionRow]}>
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL('mailto:feedback@example.com');
                }}
                style={styles.menuItemFlex}
              >
                <Text style={[styles.legendText, { color: colors.primary }]}>{t.feedback}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'web') {
                    window.open('https://buymeacoffee.com/sven4321', '_blank');
                  } else {
                    Linking.openURL('https://buymeacoffee.com/sven4321');
                  }
                }}
                style={styles.menuItemFlex}
              >
                <Text style={[styles.legendText, { color: colors.primary }]}>{t.support}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

            {/* About */}
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.about}</Text>
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t.version} {APP_VERSION}</Text>
              <Text style={[styles.legendText, { color: colors.textSecondary, marginTop: 8 }]}>
                {t.dataSource}: {getDataSourceInfo().name}
              </Text>
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {t.dataLicense}: {getDataSourceInfo().license}
              </Text>
              <Text style={[styles.legendText, { color: colors.textSecondary, marginTop: 8 }]}>
                {t.appLicense}: Open Source • MIT
              </Text>
              <Text style={[styles.legendText, { color: colors.textSecondary, fontSize: 11 }]}>
                {language === 'de' ? 'Keine kommerzielle Nutzung ohne Genehmigung' : 'No commercial use without permission'}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Main Content */}
      <ScrollView style={styles.scrollView}>
        {currentView === 'metrics' && energyData.length > 0 && metrics ? (
          <View style={styles.metricsContainer}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.surface }]}
              onPress={() => setCurrentView('charts')}
            >
              <Text style={[styles.backButtonText, { color: colors.primary }]}>  {t.backToCharts}</Text>
            </TouchableOpacity>
            <MetricsView metrics={metrics} colors={colors} />
          </View>
        ) : energyData.length > 0 ? (
          <>
            <RenewableBarChart
              title={t.renewableTitle}
              subtitle={`${t.timeRange}: ${energyData.length > 0 ? formatDate(energyData[0].timestamp) : t.loadingData} - ${energyData.length > 0 ? formatDate(energyData[energyData.length - 1].timestamp) : t.loadingData}`}
              data={energyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
              labels={{
                yAxis: t.renewablePercent,
                now: t.now,
                average: t.average,
              }}
            />

            <PriceBarChart
              title={t.priceTitle}
              subtitle={`${t.timeRange}: ${energyData.length > 0 ? formatDate(energyData[0].timestamp) : t.loadingData} - ${energyData.length > 0 ? formatDate(energyData[energyData.length - 1].timestamp) : t.loadingData}`}
              data={energyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
              labels={{
                yAxis: t.pricePerKwh,
                now: t.now,
                average: t.average,
              }}
            />

            <CorrelationScatterChart
              title={t.correlationTitle}
              subtitle={`${t.timeRange}: ${energyData.length > 0 ? formatDate(energyData[0].timestamp) : t.loadingData} - ${energyData.length > 0 ? formatDate(energyData[energyData.length - 1].timestamp) : t.loadingData}`}
              data={energyData}
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
          </>
        ) : null}
        {energyData.length === 0 && (
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
    left: '10%',
    right: '10%',
    maxHeight: '80%',
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
  metricsContainer: {
    padding: 12,
  },
  backButton: {
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
});
