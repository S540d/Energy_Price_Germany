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

      {/* Settings Modal */}
      {menuVisible && (
        <>
          <TouchableOpacity 
            style={styles.settingsOverlay}
            activeOpacity={1} 
            onPress={() => setMenuVisible(false)}
          />
          <View style={[styles.menu, { backgroundColor: colors.surface }]}>
            {/* Header with Theme Toggle */}
            <View style={[styles.menuHeader, { borderBottomColor: colors.gridLine }]}>
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
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Legenden */}
            <View style={styles.menuItem}>
              <Text style={[styles.menuSectionTitle, { color: colors.text }]}>Erneuerbare Energien</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                <View style={[styles.legendItem, { width: '48%' }]}>
                  <View style={[styles.legendBox, { backgroundColor: '#90A4AE' }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary, flex: 1 }]}>Überschuss (&gt;100%)</Text>
                </View>
                <View style={[styles.legendItem, { width: '48%' }]}>
                  <View style={[styles.legendBox, { backgroundColor: '#4CAF50' }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary, flex: 1 }]}>Hoch (80-100%)</Text>
                </View>
                <View style={[styles.legendItem, { width: '48%' }]}>
                  <View style={[styles.legendBox, { backgroundColor: '#FFC107' }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary, flex: 1 }]}>Mittel (50-80%)</Text>
                </View>
                <View style={[styles.legendItem, { width: '48%' }]}>
                  <View style={[styles.legendBox, { backgroundColor: '#F44336' }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary, flex: 1 }]}>Niedrig (&lt;50%)</Text>
                </View>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

            <View style={styles.menuItem}>
              <Text style={[styles.menuSectionTitle, { color: colors.text }]}>Börsenstrompreis</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                <View style={[styles.legendItem, { width: '48%' }]}>
                  <View style={[styles.legendBox, { backgroundColor: '#4CAF50' }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary, flex: 1 }]}>Niedrig (&lt;25 ¢)</Text>
                </View>
                <View style={[styles.legendItem, { width: '48%' }]}>
                  <View style={[styles.legendBox, { backgroundColor: '#FFC107' }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary, flex: 1 }]}>Mittel (25-35 ¢)</Text>
                </View>
                <View style={[styles.legendItem, { width: '48%' }]}>
                  <View style={[styles.legendBox, { backgroundColor: '#F44336' }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary, flex: 1 }]}>Hoch (&gt;35 ¢)</Text>
                </View>
                <View style={[styles.legendItem, { width: '48%' }]}>
                  <View style={[styles.legendBox, { backgroundColor: '#757575', opacity: 0.6 }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary, flex: 1 }]}>Netzentgelte (~18 ¢)</Text>
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
                setCurrentView('metrics');
                setMenuVisible(false);
              }}
            >
              <Text style={{ color: colors.text }}>📈 Metriken anzeigen</Text>
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

            <View style={styles.menuItem}>
              <Text style={[styles.legendText, { color: colors.textSecondary, textAlign: 'center' }]}>
                Version {APP_VERSION}
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

      {/* Footer with Settings and Support */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderColor: colors.gridLine }]}>
        <TouchableOpacity onPress={() => {
          if (Platform.OS === 'web') {
            window.open('https://buymeacoffee.com/sven4321', '_blank');
          }
        }}
        style={styles.footerButton}
        >
          <Text style={[styles.footerButtonText, { color: colors.primary }]}>
            Support me
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.footerButton}
        >
          <Text style={[styles.footerButtonText, { color: colors.text, fontSize: 20, fontWeight: 'bold' }]}>
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
    justifyContent: 'space-between',
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
});
