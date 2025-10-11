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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator } from 'react-native';
import { fetchEnergyData, getCurrentDataSource } from './services/energyDataManager';
import { RenewableBarChart } from './components/charts/RenewableBarChart';
import { PriceBarChart } from './components/charts/PriceBarChart';
import { CorrelationScatterChart } from './components/charts/CorrelationScatterChart';
import { MetricsView } from './components/MetricsView';
import { calculateMetrics, EnergyData } from './utils/metrics';
import { exportAsCSV, exportAsJSON } from './services/exportService';
import { getThemeColors, Theme } from './utils/theme';

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

      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Energy Prices Germany</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setCurrentView('charts')}
            style={[
              styles.tabButton,
              currentView === 'charts' && { backgroundColor: colors.primary }
            ]}
          >
            <Text style={[
              styles.tabButtonText,
              { color: currentView === 'charts' ? '#fff' : colors.text }
            ]}>
              📊 Diagramme
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCurrentView('metrics')}
            style={[
              styles.tabButton,
              currentView === 'metrics' && { backgroundColor: colors.primary }
            ]}
          >
            <Text style={[
              styles.tabButtonText,
              { color: currentView === 'metrics' ? '#fff' : colors.text }
            ]}>
              📈 Metrik
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMenuVisible(!menuVisible)}
            style={styles.menuButton}
          >
            <Text style={[styles.menuIcon, { color: colors.text }]}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Menu */}
      {menuVisible && (
        <View style={[styles.menu, { backgroundColor: colors.surface }]}>
          {/* Theme Slider */}
          <View style={styles.menuItem}>
            <Text style={[styles.menuSectionTitle, { color: colors.text }]}>Theme</Text>
            <View style={styles.themeToggle}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  theme === 'dark' && styles.themeButtonActive,
                  { backgroundColor: theme === 'dark' ? colors.primary : colors.gridLine }
                ]}
                onPress={() => setTheme('dark')}
              >
                <Text style={{ color: theme === 'dark' ? '#fff' : colors.text, fontSize: 12 }}>🌙 Dunkel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  theme === 'system' && styles.themeButtonActive,
                  { backgroundColor: theme === 'system' ? colors.primary : colors.gridLine }
                ]}
                onPress={() => setTheme('system')}
              >
                <Text style={{ color: theme === 'system' ? '#fff' : colors.text, fontSize: 12 }}>📱 System</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

          {/* Legenden */}
          <View style={styles.menuItem}>
            <Text style={[styles.menuSectionTitle, { color: colors.text }]}>Erneuerbare Energien</Text>
            <View style={{ gap: 5 }}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#90A4AE' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Überschuss (nur &gt;100%, Rest grün)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Hoch (80-100%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#FFC107' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Mittel (50-80%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#F44336' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Niedrig (&lt;50%)</Text>
              </View>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

          <View style={styles.menuItem}>
            <Text style={[styles.menuSectionTitle, { color: colors.text }]}>Börsenstrompreis</Text>
            <View style={{ gap: 5 }}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Niedrig (&lt;25 ¢/kWh)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#FFC107' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Mittel (25-35 ¢/kWh)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#F44336' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Hoch (&gt;35 ¢/kWh)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#757575', opacity: 0.6 }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Netzentgelte (~20 ¢/kWh)</Text>
              </View>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

          <View style={styles.menuItem}>
            <Text style={[styles.menuSectionTitle, { color: colors.text }]}>Datenquelle</Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              {getDataSourceInfo().name}
            </Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Lizenz: {getDataSourceInfo().license}
            </Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              {getDataSourceInfo().url}
            </Text>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              exportAsCSV(energyData);
              setMenuVisible(false);
            }}
          >
            <Text style={{ color: colors.text }}>💾 Export als CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              exportAsJSON(energyData);
              setMenuVisible(false);
            }}
          >
            <Text style={{ color: colors.text }}>📄 Export als JSON</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <ScrollView style={styles.scrollView}>
        {currentView === 'charts' && energyData.length > 0 ? (
          <>
            <RenewableBarChart
              title="Anteil Erneuerbarer Energien an der Last (%)"
              data={energyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              Zeitraum: {energyData.length > 0 ? new Date(energyData[0].timestamp).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'Lädt...'}
              {' bis '}
              {energyData.length > 0 ? new Date(energyData[energyData.length - 1].timestamp).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'Lädt...'}
            </Text>

            <PriceBarChart
              title="Börsen- und Endkundenstrompreis (Cent/kWh)"
              data={energyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              Zeitraum: {energyData.length > 0 ? new Date(energyData[0].timestamp).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'Lädt...'}
              {' bis '}
              {energyData.length > 0 ? new Date(energyData[energyData.length - 1].timestamp).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'Lädt...'}
            </Text>

            <CorrelationScatterChart
              title="Korrelation: Preis vs. Erneuerbare"
              data={energyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              Zeitraum: {energyData.length > 0 ? new Date(energyData[0].timestamp).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'Lädt...'}
              {' bis '}
              {energyData.length > 0 ? new Date(energyData[energyData.length - 1].timestamp).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : 'Lädt...'}
            </Text>

          </>
        ) : null}

        {currentView === 'metrics' && energyData.length > 0 && metrics ? (
          <MetricsView metrics={metrics} colors={colors} />
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

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => {
          if (Platform.OS === 'web') {
            window.open('https://buymeacoffee.com/sven4321', '_blank');
          }
        }}>
          <Text style={[styles.footerLink, { color: colors.primary }]}>
            ☕ Support me
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menu: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 220,
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
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
  footer: {
    padding: 12,
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
