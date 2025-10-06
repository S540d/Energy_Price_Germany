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
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator } from 'react-native';
import Svg, { Rect, Circle, Line } from 'react-native-svg';

type Theme = 'light' | 'dark' | 'system';

// Cache für API-Daten (3 Stunden) - in-memory cache
let cachedData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 Stunden in Millisekunden

// Fetch real data from Energy Charts API with caching
async function fetchEnergyData() {
  // Prüfe In-Memory Cache
  const age = Date.now() - cacheTimestamp;
  if (cachedData && age < CACHE_DURATION) {
    console.log('Using cached energy data (age: ' + Math.round(age / 1000 / 60) + ' minutes)');
    return cachedData;
  }

  // Daten von API abrufen (via CORS-Proxy)
  console.log('Fetching fresh energy data from API...');
  const now = Date.now();

  // CORS-Proxy um die API-Blockierung zu umgehen
  const CORS_PROXY = 'https://corsproxy.io/?';

  try {
    const [priceRes, renewableRes] = await Promise.all([
      fetch(`${CORS_PROXY}${encodeURIComponent(`https://api.energy-charts.info/price?country=de&_t=${now}`)}`),
      fetch(`${CORS_PROXY}${encodeURIComponent(`https://api.energy-charts.info/ren_share_forecast?country=de&_t=${now}`)}`)
    ]);

    console.log('Price API status:', priceRes.status, priceRes.statusText);
    console.log('Renewable API status:', renewableRes.status, renewableRes.statusText);

    if (!priceRes.ok || !renewableRes.ok) {
      throw new Error(`API request failed - Price: ${priceRes.status}, Renewable: ${renewableRes.status}`);
    }

    const priceData = await priceRes.json();
    const renewableData = await renewableRes.json();

    console.log('Price data points:', priceData.unix_seconds?.length || 0);
    console.log('Renewable data points:', renewableData.unix_seconds?.length || 0);

    const dataMap = new Map();
    priceData.unix_seconds.forEach((ts: number, i: number) => {
      dataMap.set(ts * 1000, { timestamp: ts * 1000, marketPrice: priceData.price[i], renewableShare: null });
    });
    renewableData.unix_seconds.forEach((ts: number, i: number) => {
      const existing = dataMap.get(ts * 1000);
      if (existing) existing.renewableShare = renewableData.ren_share[i];
      else dataMap.set(ts * 1000, { timestamp: ts * 1000, marketPrice: null, renewableShare: renewableData.ren_share[i] });
    });

    const result = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    // Speichere in In-Memory Cache
    cachedData = result;
    cacheTimestamp = Date.now();
    console.log('Cached fresh energy data:', result.length, 'data points');

    return result;
  } catch (error) {
    console.error('Detailed fetch error:', error);
    throw error;
  }
}

export default function App() {
  const [energyData, setEnergyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('system');
  const [menuVisible, setMenuVisible] = useState(false);
  const systemTheme = useColorScheme();

  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchEnergyData();
        setEnergyData(data);
      } catch (error) {
        console.error('Failed to load energy data:', error);
        console.log('Using mock data as fallback due to CORS');

        // FALLBACK: Mock-Daten wenn API fehlschlägt (CORS)
        const mockData = [];
        const now = Date.now();
        for (let i = 0; i < 96; i++) {
          const hour = i / 4;
          mockData.push({
            timestamp: now - (96 - i) * 15 * 60 * 1000,
            marketPrice: 30 + Math.sin(hour / 24 * Math.PI * 2) * 20 + Math.random() * 10,
            renewableShare: 60 + Math.sin((hour - 6) / 24 * Math.PI * 2) * 30 + Math.random() * 10,
          });
        }
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
        gridLine: '#555',
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
        <TouchableOpacity
          onPress={() => setMenuVisible(!menuVisible)}
          style={styles.menuButton}
        >
          <Text style={[styles.menuIcon, { color: colors.text }]}>⋮</Text>
        </TouchableOpacity>
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
                <View style={[styles.legendBox, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Hoch (&gt;80%)</Text>
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
        {energyData.length > 0 ? (
          <>
            <RenewableBarChart
              title="Anteil Erneuerbarer Energien an der Last (%)"
              data={energyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
              averageValue={(energyData.filter(d => d.renewableShare !== null).reduce((sum, d) => sum + d.renewableShare!, 0) /
                energyData.filter(d => d.renewableShare !== null).length).toFixed(1) + '%'}
            />

            <PriceBarChart
              title="Börsenstrompreis (Cent/kWh)"
              data={energyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
              averageValue={(energyData.filter(d => d.marketPrice !== null).reduce((sum, d) => sum + d.marketPrice! * 0.1, 0) /
                energyData.filter(d => d.marketPrice !== null).length).toFixed(2) + ' ¢'}
            />

            <CorrelationScatterChart
              title="Korrelation: Preis vs. Erneuerbare"
              data={energyData}
              backgroundColor={colors.surface}
              textColor={colors.text}
              gridColor={colors.gridLine}
              pointColor={colors.primary}
            />
          </>
        ) : (
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

// Renewable Bar Chart mit Farbcodierung
function RenewableBarChart({
  title,
  data,
  backgroundColor,
  textColor,
  gridColor,
  averageValue,
}: {
  title: string;
  data: Array<{ timestamp: number; marketPrice: number | null; renewableShare: number | null }>;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  averageValue: string;
}) {
  const screenWidth = Dimensions.get('window').width;
  const chartHeight = 200;
  const padding = 40;
  const bottomPadding = 50;
  // Breite max 3,5x Höhe, aber auch nicht breiter als Bildschirm - 48px (margins)
  const maxChartWidth = Math.min(chartHeight * 3.5, screenWidth - 48);
  const chartWidth = maxChartWidth;

  const values = data.map(d => d.renewableShare).filter(v => v !== null) as number[];
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const range = max - min;

  const now = Date.now();
  const timestamps = data.map(d => d.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeRange = maxTime - minTime;

  // Farbcodierung: hoch = grün, mittel = gelb, niedrig = rot (invertiert zu Preis)
  const getColor = (renewablePercent: number) => {
    if (renewablePercent > 80) return '#4CAF50'; // Grün (hoch)
    if (renewablePercent > 50) return '#FFC107'; // Gelb (mittel)
    return '#F44336'; // Rot (niedrig)
  };

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={[styles.cardTitle, { color: textColor, marginBottom: 0 }]}>{title}</Text>
        <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>Ø {averageValue}</Text>
      </View>
      <View style={{ height: chartHeight + bottomPadding, width: chartWidth }}>
        {/* Grid Lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (i / 4) * (chartHeight - padding);
          return (
            <View
              key={`grid-${i}`}
              style={{
                position: 'absolute',
                left: padding,
                top: y,
                width: chartWidth - padding,
                height: 1,
                backgroundColor: gridColor,
                opacity: 0.3,
              }}
            />
          );
        })}

        {/* Bars */}
        <Svg width={chartWidth} height={chartHeight + bottomPadding}>
          {data.map((d, index) => {
            const value = d.renewableShare;
            if (value === null) return null;

            const x = padding + ((d.timestamp - minTime) / timeRange) * (chartWidth - padding);
            const barWidth = ((chartWidth - padding) / data.length) * 0.8;
            const barHeight = ((value - min) / range) * (chartHeight - padding);
            const y = chartHeight - barHeight;

            return (
              <Rect
                key={index}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={getColor(value)}
                opacity={0.9}
              />
            );
          })}

          {/* "Jetzt" Markierung */}
          {now >= minTime && now <= maxTime && (
            <Line
              x1={padding + ((now - minTime) / timeRange) * (chartWidth - padding)}
              y1={padding}
              x2={padding + ((now - minTime) / timeRange) * (chartWidth - padding)}
              y2={chartHeight}
              stroke="red"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
        </Svg>

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = max - (i / 4) * range;
          const y = padding + (i / 4) * (chartHeight - padding);
          return (
            <Text
              key={`ylabel-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                top: y - 8,
                fontSize: 10,
                color: textColor,
                opacity: 0.6,
              }}
            >
              {value.toFixed(0)}%
            </Text>
          );
        })}

        {/* X-axis labels (alle 3 Stunden) */}
        {(() => {
          const labels = [];
          const startDate = new Date(minTime);
          const endDate = new Date(maxTime);

          const startHour = Math.ceil(startDate.getHours() / 3) * 3;
          const current = new Date(startDate);
          current.setHours(startHour, 0, 0, 0);

          while (current <= endDate) {
            const timestamp = current.getTime();
            const x = padding + ((timestamp - minTime) / timeRange) * (chartWidth - padding);
            const hour = current.getHours();

            labels.push(
              <Text
                key={`xlabel-${timestamp}`}
                style={{
                  position: 'absolute',
                  left: x - 10,
                  top: chartHeight + 5,
                  fontSize: 10,
                  color: textColor,
                  opacity: 0.6,
                }}
              >
                {hour}h
              </Text>
            );

            current.setHours(current.getHours() + 3);
          }

          return labels;
        })()}

        {/* "Jetzt" Label */}
        {now >= minTime && now <= maxTime && (
          <Text
            style={{
              position: 'absolute',
              left: padding + ((now - minTime) / timeRange) * (chartWidth - padding) - 15,
              top: chartHeight + 20,
              fontSize: 10,
              color: 'red',
              fontWeight: 'bold',
            }}
          >
            Jetzt
          </Text>
        )}
      </View>
    </View>
  );
}

// Price Bar Chart mit Farbcodierung und Netzentgelten
function PriceBarChart({
  title,
  data,
  backgroundColor,
  textColor,
  gridColor,
  averageValue,
}: {
  title: string;
  data: Array<{ timestamp: number; marketPrice: number | null; renewableShare: number | null }>;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  averageValue: string;
}) {
  const screenWidth = Dimensions.get('window').width;
  const chartHeight = 200;
  const padding = 40;
  const bottomPadding = 50;
  // Breite max 3,5x Höhe, aber auch nicht breiter als Bildschirm - 48px (margins)
  const maxChartWidth = Math.min(chartHeight * 3.5, screenWidth - 48);
  const chartWidth = maxChartWidth;

  // Konvertiere EUR/MWh zu Cent/kWh: 1 EUR/MWh = 0.1 Cent/kWh
  const pricesInCent = data.map(d => d.marketPrice !== null ? d.marketPrice * 0.1 : null);

  // Netzentgelte, Steuern und Abgaben (ca. 20 Cent/kWh als Durchschnitt)
  const GRID_FEES_AND_TAXES = 20; // Cent/kWh

  const validPrices = pricesInCent.filter(p => p !== null) as number[];
  const maxMarketPrice = Math.max(...validPrices);
  const maxTotal = maxMarketPrice + GRID_FEES_AND_TAXES;
  const min = Math.min(...validPrices, 0);
  const range = maxTotal - min;

  const now = Date.now();
  const timestamps = data.map(d => d.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeRange = maxTime - minTime;

  // Farbcodierung basierend auf Gesamtpreis
  const getColor = (totalPrice: number) => {
    if (totalPrice < 25) return '#4CAF50'; // Grün (niedrig)
    if (totalPrice < 35) return '#FFC107'; // Gelb (mittel)
    return '#F44336'; // Rot (hoch)
  };

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={[styles.cardTitle, { color: textColor, marginBottom: 0 }]}>{title}</Text>
        <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>Ø {averageValue}</Text>
      </View>
      <View style={{ height: chartHeight + bottomPadding, width: chartWidth }}>
        {/* Grid Lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (i / 4) * (chartHeight - padding);
          return (
            <View
              key={`grid-${i}`}
              style={{
                position: 'absolute',
                left: padding,
                top: y,
                width: chartWidth - padding,
                height: 1,
                backgroundColor: gridColor,
                opacity: 0.3,
              }}
            />
          );
        })}

        {/* Bars */}
        <Svg width={chartWidth} height={chartHeight + bottomPadding}>
          {data.map((d, index) => {
            const marketPrice = d.marketPrice !== null ? d.marketPrice * 0.1 : null;
            if (marketPrice === null) return null;

            const totalPrice = marketPrice + GRID_FEES_AND_TAXES;
            const x = padding + ((d.timestamp - minTime) / timeRange) * (chartWidth - padding);
            const barWidth = ((chartWidth - padding) / data.length) * 0.8;

            // Marktpreis-Balken (farbcodiert)
            const marketBarHeight = ((marketPrice - min) / range) * (chartHeight - padding);
            const marketY = chartHeight - marketBarHeight;

            // Netzentgelte-Balken (grau, darüber)
            const gridBarHeight = (GRID_FEES_AND_TAXES / range) * (chartHeight - padding);
            const gridY = marketY - gridBarHeight;

            return (
              <React.Fragment key={index}>
                {/* Marktpreis (farbcodiert) */}
                <Rect
                  x={x - barWidth / 2}
                  y={marketY}
                  width={barWidth}
                  height={marketBarHeight}
                  fill={getColor(totalPrice)}
                  opacity={0.9}
                />
                {/* Netzentgelte & Steuern (grau) */}
                <Rect
                  x={x - barWidth / 2}
                  y={gridY}
                  width={barWidth}
                  height={gridBarHeight}
                  fill="#757575"
                  opacity={0.6}
                />
              </React.Fragment>
            );
          })}

          {/* "Jetzt" Markierung */}
          {now >= minTime && now <= maxTime && (
            <Line
              x1={padding + ((now - minTime) / timeRange) * (chartWidth - padding)}
              y1={padding}
              x2={padding + ((now - minTime) / timeRange) * (chartWidth - padding)}
              y2={chartHeight}
              stroke="red"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
        </Svg>

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = maxTotal - (i / 4) * range;
          const y = padding + (i / 4) * (chartHeight - padding);
          return (
            <Text
              key={`ylabel-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                top: y - 8,
                fontSize: 10,
                color: textColor,
                opacity: 0.6,
              }}
            >
              {value.toFixed(1)}
            </Text>
          );
        })}

        {/* X-axis labels (alle 3 Stunden) */}
        {(() => {
          const labels = [];
          const startDate = new Date(minTime);
          const endDate = new Date(maxTime);

          const startHour = Math.ceil(startDate.getHours() / 3) * 3;
          const current = new Date(startDate);
          current.setHours(startHour, 0, 0, 0);

          while (current <= endDate) {
            const timestamp = current.getTime();
            const x = padding + ((timestamp - minTime) / timeRange) * (chartWidth - padding);
            const hour = current.getHours();

            labels.push(
              <Text
                key={`xlabel-${timestamp}`}
                style={{
                  position: 'absolute',
                  left: x - 10,
                  top: chartHeight + 5,
                  fontSize: 10,
                  color: textColor,
                  opacity: 0.6,
                }}
              >
                {hour}h
              </Text>
            );

            current.setHours(current.getHours() + 3);
          }

          return labels;
        })()}

        {/* "Jetzt" Label */}
        {now >= minTime && now <= maxTime && (
          <Text
            style={{
              position: 'absolute',
              left: padding + ((now - minTime) / timeRange) * (chartWidth - padding) - 15,
              top: chartHeight + 20,
              fontSize: 10,
              color: 'red',
              fontWeight: 'bold',
            }}
          >
            Jetzt
          </Text>
        )}
      </View>
    </View>
  );
}

// Time Series Bar Chart Component mit Zeitachse
function TimeSeriesBarChart({
  title,
  data,
  valueKey,
  color,
  backgroundColor,
  textColor,
  gridColor,
}: {
  title: string;
  data: Array<{ timestamp: number; marketPrice: number | null; renewableShare: number | null }>;
  valueKey: 'marketPrice' | 'renewableShare';
  color: string;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
}) {
  const chartWidth = Dimensions.get('window').width - 64;
  const chartHeight = 200;
  const padding = 40;
  const bottomPadding = 50;

  const values = data.map(d => d[valueKey]).filter(v => v !== null) as number[];
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const range = max - min;

  const now = Date.now();
  const timestamps = data.map(d => d.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeRange = maxTime - minTime;

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
      <View style={{ height: chartHeight + bottomPadding, width: chartWidth }}>
        {/* Grid Lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (i / 4) * (chartHeight - padding);
          return (
            <View
              key={`grid-${i}`}
              style={{
                position: 'absolute',
                left: padding,
                top: y,
                width: chartWidth - padding,
                height: 1,
                backgroundColor: gridColor,
                opacity: 0.3,
              }}
            />
          );
        })}

        {/* Bars */}
        <Svg width={chartWidth} height={chartHeight + bottomPadding}>
          {data.map((d, index) => {
            const value = d[valueKey];
            if (value === null) return null;

            const x = padding + ((d.timestamp - minTime) / timeRange) * (chartWidth - padding);
            const barWidth = ((chartWidth - padding) / data.length) * 0.8;
            const barHeight = ((value - min) / range) * (chartHeight - padding);
            const y = chartHeight - barHeight;

            return (
              <Rect
                key={index}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                opacity={0.8}
              />
            );
          })}

          {/* "Jetzt" Markierung */}
          {now >= minTime && now <= maxTime && (
            <>
              <Line
                x1={padding + ((now - minTime) / timeRange) * (chartWidth - padding)}
                y1={padding}
                x2={padding + ((now - minTime) / timeRange) * (chartWidth - padding)}
                y2={chartHeight}
                stroke="red"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </>
          )}
        </Svg>

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = max - (i / 4) * range;
          const y = padding + (i / 4) * (chartHeight - padding);
          return (
            <Text
              key={`ylabel-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                top: y - 8,
                fontSize: 10,
                color: textColor,
                opacity: 0.6,
              }}
            >
              {value.toFixed(0)}
            </Text>
          );
        })}

        {/* X-axis labels (alle 3 Stunden) */}
        {(() => {
          const labels = [];
          const startDate = new Date(minTime);
          const endDate = new Date(maxTime);

          // Runde auf nächste 3-Stunden-Marke
          const startHour = Math.ceil(startDate.getHours() / 3) * 3;
          const current = new Date(startDate);
          current.setHours(startHour, 0, 0, 0);

          while (current <= endDate) {
            const timestamp = current.getTime();
            const x = padding + ((timestamp - minTime) / timeRange) * (chartWidth - padding);
            const hour = current.getHours();

            labels.push(
              <Text
                key={`xlabel-${timestamp}`}
                style={{
                  position: 'absolute',
                  left: x - 10,
                  top: chartHeight + 5,
                  fontSize: 10,
                  color: textColor,
                  opacity: 0.6,
                }}
              >
                {hour}h
              </Text>
            );

            current.setHours(current.getHours() + 3);
          }

          return labels;
        })()}

        {/* "Jetzt" Label */}
        {now >= minTime && now <= maxTime && (
          <Text
            style={{
              position: 'absolute',
              left: padding + ((now - minTime) / timeRange) * (chartWidth - padding) - 15,
              top: chartHeight + 20,
              fontSize: 10,
              color: 'red',
              fontWeight: 'bold',
            }}
          >
            Jetzt
          </Text>
        )}
      </View>
    </View>
  );
}

// Correlation Scatter Chart Component
function CorrelationScatterChart({
  title,
  data,
  backgroundColor,
  textColor,
  gridColor,
  pointColor,
}: {
  title: string;
  data: Array<{ timestamp: number; marketPrice: number | null; renewableShare: number | null }>;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  pointColor: string;
}) {
  const screenWidth = Dimensions.get('window').width;
  const chartHeight = 250;
  const padding = 50;
  // Breite max 3,5x Höhe, aber auch nicht breiter als Bildschirm - 48px (margins)
  const maxChartWidth = Math.min(chartHeight * 3.5, screenWidth - 48);
  const chartWidth = maxChartWidth;

  // Filter nur Datenpunkte wo beide Werte vorhanden sind
  const validData = data.filter(d => d.marketPrice !== null && d.renewableShare !== null);

  // Konvertiere Preis zu Cent/kWh
  const priceInCentValues = validData.map(d => (d.marketPrice as number) * 0.1);
  const renewableValues = validData.map(d => d.renewableShare as number);

  // Fixe Skalierung: Preis 0-60 Cent/kWh, Erneuerbare 0-100%
  const minPrice = 0;
  const maxPrice = 60;
  const priceRange = maxPrice - minPrice;

  const minRenewable = 0;
  const maxRenewable = 100;
  const renewableRange = maxRenewable - minRenewable;

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
      <View style={{ height: chartHeight, width: chartWidth }}>
        {/* Grid Lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (i / 4) * (chartHeight - 2 * padding);
          return (
            <View
              key={`hgrid-${i}`}
              style={{
                position: 'absolute',
                left: padding,
                top: y,
                width: chartWidth - 2 * padding,
                height: 1,
                backgroundColor: gridColor,
                opacity: 0.3,
              }}
            />
          );
        })}

        {[0, 1, 2, 3, 4].map(i => {
          const x = padding + (i / 4) * (chartWidth - 2 * padding);
          return (
            <View
              key={`vgrid-${i}`}
              style={{
                position: 'absolute',
                left: x,
                top: padding,
                width: 1,
                height: chartHeight - 2 * padding,
                backgroundColor: gridColor,
                opacity: 0.3,
              }}
            />
          );
        })}

        {/* Scatter Points */}
        <Svg width={chartWidth} height={chartHeight}>
          {validData.map((d, index) => {
            const priceInCent = (d.marketPrice! * 0.1);
            const x = padding + ((d.renewableShare! - minRenewable) / renewableRange) * (chartWidth - 2 * padding);
            const y = chartHeight - padding - ((priceInCent - minPrice) / priceRange) * (chartHeight - 2 * padding);

            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={4}
                fill={pointColor}
                opacity={0.6}
              />
            );
          })}
        </Svg>

        {/* Y-axis labels (Preis) */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = maxPrice - (i / 4) * priceRange;
          const y = padding + (i / 4) * (chartHeight - 2 * padding);
          return (
            <Text
              key={`ylabel-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                top: y - 8,
                fontSize: 10,
                color: textColor,
                opacity: 0.6,
              }}
            >
              {value.toFixed(0)}
            </Text>
          );
        })}

        {/* X-axis labels (Erneuerbare %) */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = minRenewable + (i / 4) * renewableRange;
          const x = padding + (i / 4) * (chartWidth - 2 * padding);
          return (
            <Text
              key={`xlabel-${i}`}
              style={{
                position: 'absolute',
                left: x - 15,
                top: chartHeight - 30,
                fontSize: 10,
                color: textColor,
                opacity: 0.6,
              }}
            >
              {value.toFixed(0)}%
            </Text>
          );
        })}

        {/* Axis Labels */}
        <Text
          style={{
            position: 'absolute',
            left: chartWidth / 2 - 60,
            bottom: 5,
            fontSize: 11,
            color: textColor,
            fontWeight: '600',
          }}
        >
          Erneuerbare (%)
        </Text>
        <Text
          style={{
            position: 'absolute',
            left: 5,
            top: chartHeight / 2 - 50,
            fontSize: 11,
            color: textColor,
            fontWeight: '600',
            transform: [{ rotate: '-90deg' }],
          }}
        >
          Preis (¢/kWh)
        </Text>
      </View>
    </View>
  );
}

// Simple Line Chart Component (wird nicht mehr verwendet)
function SimpleChart({
  title,
  data,
  color,
  backgroundColor,
  textColor,
  gridColor,
}: {
  title: string;
  data: number[];
  color: string;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
}) {
  const chartWidth = Dimensions.get('window').width - 64;
  const chartHeight = 200;
  const padding = 30;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - ((value - min) / range) * (chartHeight - 2 * padding);
    return { x, y };
  });

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
      <View style={{ height: chartHeight, width: chartWidth }}>
        {/* Grid Lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (i / 4) * (chartHeight - 2 * padding);
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: padding,
                top: y,
                width: chartWidth - 2 * padding,
                height: 1,
                backgroundColor: gridColor,
              }}
            />
          );
        })}

        {/* Line Path */}
        {points.map((point, index) => {
          if (index === 0) return null;
          const prev = points[index - 1];
          const angle = Math.atan2(point.y - prev.y, point.x - prev.x);
          const length = Math.sqrt(Math.pow(point.x - prev.x, 2) + Math.pow(point.y - prev.y, 2));

          return (
            <View
              key={index}
              style={{
                position: 'absolute',
                left: prev.x,
                top: prev.y,
                width: length,
                height: 2,
                backgroundColor: color,
                transform: [{ rotate: `${angle}rad` }],
                transformOrigin: 'left center',
              }}
            />
          );
        })}

        {/* Y-Axis Labels */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = max - (i / 4) * range;
          const y = padding + (i / 4) * (chartHeight - 2 * padding);
          return (
            <Text
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                top: y - 8,
                fontSize: 10,
                color: textColor,
              }}
            >
              {value.toFixed(0)}
            </Text>
          );
        })}
      </View>
    </View>
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
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
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
  footerText: {
    fontSize: 11,
    textAlign: 'center',
  },
  footerLink: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
