import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  TextInput,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { fetchEnergyData, getCurrentDataSource, energyDataManager } from './services/energyDataManager';
import { RenewableBarChart } from './components/charts/RenewableBarChart';
import { PriceBarChart } from './components/charts/PriceBarChart';
import { CorrelationScatterChart } from './components/charts/CorrelationScatterChart';
import { ChartDetailView } from './components/ChartDetailView';
import { AboutView } from './components/AboutView';
import { calculateMetrics, EnergyData, GRID_FEES_AND_TAXES } from './utils/metrics';
import { getThemeColors, Theme } from './utils/theme';
import { logger } from './utils/logger';
import { isValidPostalCode, sanitizePostalCodeInput } from './utils/postalCodeUtils';

const APP_VERSION = '1.3.0';

type Language = 'en' | 'de';

const translations = {
  en: {
    settings: 'Settings',
    customize: 'Customize',
    appearance: 'APPEARANCE',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'LANGUAGE',
    english: 'English',
    german: 'German',
    // Region Section
    region: 'REGION',
    postalCode: 'Postal Code',
    postalCodeHint: 'Enter 5-digit postal code (PLZ)',
    regionalData: 'Regional',
    nationalData: 'National',
    // Grid Fees Section
    gridFees: 'GRID FEES & TAXES',
    gridFeesHint: 'Grid fees and taxes in ¢/kWh',
    gridFeesValue: 'Grid Fees',
    // About Section
    about: 'ABOUT',
    version: 'Version',
    dataSource: 'Data Source',
    dataLicense: 'Data License',
    appLicense: 'App License',
    repository: 'GitHub Repository',
    // Support Section
    supportSection: 'SUPPORT',
    feedback: 'Send Feedback',
    supportProject: 'Support me',
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
    // Legend Section
    legend: 'LEGEND',
    legendExplanationPrefix: 'End-customer price = Market price +',
    legendExplanationSuffix: '¢/kWh (Grid fees & taxes)',
    marketPriceLabel: 'Market Price',
    gridFeesLabel: 'Grid Fees & Taxes',
    regionalDataLabel: 'Regional Data',
  },
  de: {
    settings: 'Einstellungen',
    customize: 'Personalisiere',
    appearance: 'ERSCHEINUNGSBILD',
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System',
    language: 'SPRACHE',
    english: 'English',
    german: 'Deutsch',
    // Region Section
    region: 'REGION',
    postalCode: 'Postleitzahl',
    postalCodeHint: '5-stellige PLZ eingeben',
    regionalData: 'Regional',
    nationalData: 'National',
    // Grid Fees Section
    gridFees: 'NETZENTGELTE & STEUERN',
    gridFeesHint: 'Netzentgelte und Steuern in ¢/kWh',
    gridFeesValue: 'Netzentgelte',
    // About Section
    about: 'ÜBER',
    version: 'Version',
    dataSource: 'Datenquelle',
    dataLicense: 'Daten-Lizenz',
    appLicense: 'App-Lizenz',
    repository: 'GitHub Repository',
    // Support Section
    supportSection: 'UNTERSTÜTZUNG',
    feedback: 'Feedback senden',
    supportProject: 'Support me',
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
    // Legend Section
    legend: 'LEGENDE',
    legendExplanationPrefix: 'Endkundenstrompreis = Börsenstrompreis +',
    legendExplanationSuffix: '¢/kWh (Netzentgelte & Steuern)',
    marketPriceLabel: 'Börsenstrompreis',
    gridFeesLabel: 'Netzentgelte & Steuern',
    regionalDataLabel: 'Regionale Daten',
  },
};

function AppContent() {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('system');
  const [language, setLanguage] = useState<Language>('en'); // Will be loaded from storage in useEffect
  const [postalCode, setPostalCode] = useState<string>(''); // Postal code input (immediate)
  const [debouncedPostalCode, setDebouncedPostalCode] = useState<string>(''); // Debounced for API calls
  const [gridFees, setGridFees] = useState<number>(GRID_FEES_AND_TAXES); // Grid fees and taxes
  const [menuVisible, setMenuVisible] = useState(false);
  const [customizeVisible, setCustomizeVisible] = useState(false);
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

  // Load postal code preference on mount
  useEffect(() => {
    async function loadPostalCode() {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // Web: Use localStorage
          const saved = window.localStorage?.getItem('postalCode') || ''; // platform-safe
          logger.debug('[App] Loaded postalCode from localStorage:', saved);
          setPostalCode(saved);
          // If it's already a valid postal code, set it immediately (no debounce on load)
          if (saved.length === 5) {
            setDebouncedPostalCode(saved);
          }
        } else {
          // Mobile: Use AsyncStorage
          const saved = (await AsyncStorage.getItem('postalCode')) || '';
          logger.debug('[App] Loaded postalCode from AsyncStorage:', saved);
          setPostalCode(saved);
          // If it's already a valid postal code, set it immediately (no debounce on load)
          if (saved.length === 5) {
            setDebouncedPostalCode(saved);
          }
        }
      } catch (e) {
        logger.error('[App] Failed to load postal code:', e);
      }
    }
    loadPostalCode();
  }, []);

  // Save postal code when it changes
  useEffect(() => {
    async function savePostalCode() {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // Web: Use localStorage
          window.localStorage?.setItem('postalCode', postalCode); // platform-safe
        } else {
          // Mobile: Use AsyncStorage
          await AsyncStorage.setItem('postalCode', postalCode);
        }
      } catch (e) {
        logger.error('Failed to save postal code:', e);
      }
    }
    savePostalCode();
  }, [postalCode]);

  // Load grid fees preference on mount
  useEffect(() => {
    async function loadGridFees() {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // Web: Use localStorage
          const saved = window.localStorage?.getItem('gridFees'); // platform-safe
          if (saved) {
            const value = parseFloat(saved);
            if (!isNaN(value) && value > 0) {
              setGridFees(value);
            }
          }
        } else {
          // Mobile: Use AsyncStorage
          const saved = await AsyncStorage.getItem('gridFees');
          if (saved) {
            const value = parseFloat(saved);
            if (!isNaN(value) && value > 0) {
              setGridFees(value);
            }
          }
        }
      } catch (e) {
        logger.error('[App] Failed to load grid fees:', e);
      }
    }
    loadGridFees();
  }, []);

  // Save grid fees when it changes
  useEffect(() => {
    async function saveGridFees() {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // Web: Use localStorage
          window.localStorage?.setItem('gridFees', gridFees.toString()); // platform-safe
        } else {
          // Mobile: Use AsyncStorage
          await AsyncStorage.setItem('gridFees', gridFees.toString());
        }
      } catch (e) {
        logger.error('Failed to save grid fees:', e);
      }
    }
    saveGridFees();
  }, [gridFees]);

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

  // Debounce postal code input: only trigger API call after 1s of no typing AND 5 digits
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only update debounced value if it's exactly 5 digits or empty
      if (postalCode.length === 5 || postalCode.length === 0) {
        logger.debug('[App] Debouncing postal code:', postalCode);
        setDebouncedPostalCode(postalCode);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [postalCode]);

  // Track initial mount to avoid invalidating cache on first load
  const isInitialMount = useRef(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        logger.debug('[App] Loading energy data with debouncedPostalCode:', debouncedPostalCode);

        // Invalidate cache when postal code changes (but not on initial mount)
        // This forces reload with/without regional data
        if (!isInitialMount.current) {
          logger.debug('[App] Postal code changed, invalidating cache');
          energyDataManager.invalidateCache(); // National data cache
          await energyDataManager.invalidateRegionalCache(); // Regional data cache
        } else {
          isInitialMount.current = false;
        }

        const data = await fetchEnergyData(debouncedPostalCode || undefined);
        logger.debug('[App] Received data length:', data.length);
        logger.debug('[App] First 3 items:', data.slice(0, 3));
        setEnergyData(data);
      } catch (error) {
        logger.error('[App] Failed to load energy data:', error);
        setEnergyData([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [debouncedPostalCode]);

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
                <Text style={[styles.customizeButtonText, { color: '#fff' }]}>⚙️ {t.customize}</Text>
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

            {/* REGION Section */}
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

            {/* LEGEND Section */}
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.legend}</Text>

              {/* Price Legend - Visual chart elements */}
              <View style={{
                marginTop: 8,
                padding: 12,
                backgroundColor: colors.surface,
                borderRadius: 8,
                gap: 10
              }}>
                {/* Price Breakdown Explanation */}
                <View>
                  <Text style={[{
                    color: colors.text,
                    fontSize: 13,
                    fontWeight: '600',
                    marginBottom: 8
                  }]}>
                    {t.legendExplanationPrefix} {gridFees} {t.legendExplanationSuffix}
                  </Text>
                </View>

                {/* Visual Legend - Chart Elements */}
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
                      {t.gridFeesLabel} ({gridFees} ¢/kWh)
                    </Text>
                  </View>

                  {/* Regional Data Line */}
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
                    const value = parseFloat(sanitized);
                    if (!isNaN(value) && value > 0) {
                      setGridFees(value);
                    } else if (sanitized === '' || sanitized === '.') {
                      // Allow temporary empty or just decimal point while typing
                      setGridFees(GRID_FEES_AND_TAXES);
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

// Wrap the app with SafeAreaProvider for proper edge-to-edge support on Android 15+
export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AppContent />
    </SafeAreaProvider>
  );
}
