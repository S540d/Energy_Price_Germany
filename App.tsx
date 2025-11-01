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

export default function App() {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('system');
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('charts');
  const systemTheme = useColorScheme();

  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  // Memoized metrics calculations for better performance
  const metrics = useMemo(() => calculateMetrics(energyData), [energyData]);

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
            Lade Energiedaten...
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
              <Text style={[styles.menuTitle, { color: colors.text }]}>Settings</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.text }]}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Appearance Settings */}
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
              <View style={styles.themeToggle}>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    theme === 'light' && styles.themeButtonActive,
                    { backgroundColor: theme === 'light' ? colors.primary : colors.gridLine }
                  ]}
                  onPress={() => setTheme('light')}
                >
                  <Text style={{ color: theme === 'light' ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>Light</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    theme === 'dark' && styles.themeButtonActive,
                    { backgroundColor: theme === 'dark' ? colors.primary : colors.gridLine }
                  ]}
                  onPress={() => setTheme('dark')}
                >
                  <Text style={{ color: theme === 'dark' ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>Dark</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    theme === 'system' && styles.themeButtonActive,
                    { backgroundColor: theme === 'system' ? colors.primary : colors.gridLine }
                  ]}
                  onPress={() => setTheme('system')}
                >
                  <Text style={{ color: theme === 'system' ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>System</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

            {/* Feedback */}
            <View style={styles.menuSection}>
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL('mailto:feedback@example.com');
                }}
                style={styles.menuItem}
              >
                <Text style={[styles.legendText, { color: colors.primary }]}>Send Feedback</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

            {/* About */}
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Version {APP_VERSION}</Text>
              <Text style={[styles.legendText, { color: colors.textSecondary, marginTop: 8 }]}>
                Data: {getDataSourceInfo().name}
              </Text>
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                License: {getDataSourceInfo().license}
              </Text>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

            {/* Support Section */}
            <View style={styles.menuSection}>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'web') {
                    window.open('https://buymeacoffee.com/sven4321', '_blank');
                  } else {
                    Linking.openURL('https://buymeacoffee.com/sven4321');
                  }
                }}
                style={styles.menuItem}
              >
                <Text style={[styles.legendText, { color: colors.primary }]}>Buy Me a Coffee</Text>
              </TouchableOpacity>
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
              <Text style={[styles.backButtonText, { color: colors.primary }]}>← Zurück zu Diagrammen</Text>
            </TouchableOpacity>
            <MetricsView metrics={metrics} colors={colors} />
          </View>
        ) : energyData.length > 0 ? (
          <>
            <RenewableBarChart
              title="Anteil Erneuerbarer Energien an der Last"
              subtitle={`Zeitraum: ${energyData.length > 0 ? new Date(energyData[0].timestamp).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'Lädt...'} bis ${energyData.length > 0 ? new Date(energyData[energyData.length - 1].timestamp).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'Lädt...'}`}
              data={energyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
            />

            <PriceBarChart
              title="Börsen- und Endkundenstrompreis"
              subtitle={`Zeitraum: ${energyData.length > 0 ? new Date(energyData[0].timestamp).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'Lädt...'} bis ${energyData.length > 0 ? new Date(energyData[energyData.length - 1].timestamp).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'Lädt...'}`}
              data={energyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
            />

            <CorrelationScatterChart
              title="Korrelation: Preis vs. Erneuerbare"
              subtitle={`Zeitraum: ${energyData.length > 0 ? new Date(energyData[0].timestamp).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'Lädt...'} bis ${energyData.length > 0 ? new Date(energyData[energyData.length - 1].timestamp).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'Lädt...'}`}
              data={energyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
            />
          </>
        ) : null}
        {energyData.length === 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Keine Daten verfügbar
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Die Energiedaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer with Settings */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderColor: colors.gridLine }]}>
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.footerButton}
          aria-label="Settings"
        >
          <Text style={[styles.footerButtonText, { color: colors.primary, fontSize: 20, fontWeight: 'bold' }]}>
            ⋮
          </Text>
        </TouchableOpacity>
      </View>
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
  footerContainer: {
    // Container is not needed anymore, footer aligns with charts
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',  // Changed from flex-start to stretch to match card width
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerButton: {
    padding: 8,
  },
  footerButtonText: {
    fontSize: 14,  // Reduced from 16 to 14
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
