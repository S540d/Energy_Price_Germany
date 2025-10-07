import React, { useState, useEffect } from 'react';
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
import { fetchEnergyData, generateMockData } from './services/energyApi';
import { RenewableBarChart } from './components/charts/RenewableBarChart';
import { PriceBarChart } from './components/charts/PriceBarChart';
import { CorrelationScatterChart } from './components/charts/CorrelationScatterChart';

type Theme = 'light' | 'dark' | 'system';
type View = 'charts' | 'metrics';

export default function App() {
  const [energyData, setEnergyData] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('system');
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentView, setCurrentView] = useState<View>('charts');
  const systemTheme = useColorScheme();

  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchEnergyData();
        setEnergyData(data);

        // Lade marketdata.json
        try {
          const marketResponse = await fetch('/marketdata.json');
          if (marketResponse.ok) {
            const marketJson = await marketResponse.json();
            // Transformiere Datenformat: { start_timestamp, marketprice } -> { timestamp, marketPrice, renewableShare }
            const transformedData = marketJson.data.map((item: any) => ({
              timestamp: item.start_timestamp,
              marketPrice: item.marketprice, // Bereits in EUR/MWh
              renewableShare: null
            }));
            setMarketData(transformedData);
            console.log('Loaded marketdata.json:', transformedData.length, 'data points');
          }
        } catch (err) {
          console.log('marketdata.json not available:', err);
        }
      } catch (error) {
        console.error('Failed to load energy data:', error);
        console.log('Using mock data as fallback due to CORS');
        const mockData = generateMockData();
        setEnergyData(mockData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const colors = isDark
    ? {
        background: '#121212',
        surface: '#1E1E1E',
        text: '#E0E0E0',
        textSecondary: '#A0A0A0',
        primary: '#90CAF9',
        chartLine: '#90CAF9',
        chartLine2: '#CE93D8',
        gridLine: '#888888',
      }
    : {
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#666666',
        primary: '#1976D2',
        chartLine: '#1976D2',
        chartLine2: '#9C27B0',
        gridLine: '#E0E0E0',
      };

  const exportAsCSV = () => {
    const csv = [
      'Zeitstempel,Börsenstrompreis (EUR/MWh),Anteil Erneuerbarer (%)',
      ...energyData.map(d =>
        `${new Date(d.timestamp).toISOString()},${d.marketPrice.toFixed(2)},${d.renewableShare.toFixed(2)}`
      ),
    ].join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'energy_data.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const exportAsJSON = () => {
    const json = JSON.stringify(energyData, null, 2);

    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'energy_data.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
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
      <StatusBar style={isDark ? 'light' : 'dark'} />

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
              Energy Charts (Fraunhofer ISE)
            </Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Lizenz: CC BY 4.0
            </Text>
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              api.energy-charts.info
            </Text>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              exportAsCSV();
              setMenuVisible(false);
            }}
          >
            <Text style={{ color: colors.text }}>💾 Export als CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              exportAsJSON();
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

            <PriceBarChart
              title="Börsen- und Endkundenstrompreis (Cent/kWh)"
              data={energyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
            />

            <CorrelationScatterChart
              title="Korrelation: Preis vs. Erneuerbare"
              data={energyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
            />

            {marketData.length > 0 && (
              <PriceBarChart
                title="Börsen- und Endkundenstrompreis (Cent/kWh)"
                data={marketData}
                backgroundColor={colors.surface}
                textColor={colors.text}
                gridColor={colors.gridLine}
              />
            )}
          </>
        ) : null}

        {currentView === 'metrics' && energyData.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 16 }]}>
              Metriken
            </Text>

            {/* Zeitraum */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Zeitraum
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {new Date(Math.min(...energyData.map(d => d.timestamp))).toLocaleString('de-DE', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
                {' bis '}
                {new Date(Math.max(...energyData.map(d => d.timestamp))).toLocaleString('de-DE', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </Text>
            </View>

            {/* Erneuerbare Energien */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Anteil Erneuerbarer Energien (%)
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Durchschnitt</Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                    {(energyData.filter(d => d.renewableShare !== null)
                      .reduce((sum, d) => sum + d.renewableShare!, 0) /
                      energyData.filter(d => d.renewableShare !== null).length).toFixed(1)}%
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Minimum</Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                    {Math.min(...energyData.filter(d => d.renewableShare !== null).map(d => d.renewableShare!)).toFixed(1)}%
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Maximum</Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                    {Math.max(...energyData.filter(d => d.renewableShare !== null).map(d => d.renewableShare!)).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Börsenstrompreis */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Börsenstrompreis (Cent/kWh)
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Durchschnitt</Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                    {(energyData.filter(d => d.marketPrice !== null)
                      .reduce((sum, d) => sum + d.marketPrice! * 0.1, 0) /
                      energyData.filter(d => d.marketPrice !== null).length).toFixed(2)} ¢
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Minimum</Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                    {(Math.min(...energyData.filter(d => d.marketPrice !== null).map(d => d.marketPrice!)) * 0.1).toFixed(2)} ¢
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Maximum</Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                    {(Math.max(...energyData.filter(d => d.marketPrice !== null).map(d => d.marketPrice!)) * 0.1).toFixed(2)} ¢
                  </Text>
                </View>
              </View>
            </View>

            {/* Endkundenstrompreis (inkl. Netzentgelte) */}
            <View>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Endkundenstrompreis (Cent/kWh)
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Durchschnitt</Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                    {(energyData.filter(d => d.marketPrice !== null)
                      .reduce((sum, d) => sum + d.marketPrice! * 0.1, 0) /
                      energyData.filter(d => d.marketPrice !== null).length + 20).toFixed(2)} ¢
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Minimum</Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                    {((Math.min(...energyData.filter(d => d.marketPrice !== null).map(d => d.marketPrice!)) * 0.1) + 20).toFixed(2)} ¢
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Maximum</Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                    {((Math.max(...energyData.filter(d => d.marketPrice !== null).map(d => d.marketPrice!)) * 0.1) + 20).toFixed(2)} ¢
                  </Text>
                </View>
              </View>
            </View>
          </View>
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
