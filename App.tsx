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

// Mock Data Generator
const generateMockData = () => {
  const data = [];
  const now = Date.now();
  // Last 6 hours + next 18 hours
  for (let i = -6; i <= 18; i++) {
    const timestamp = now + i * 3600000;
    data.push({
      timestamp,
      marketPrice: 30 + Math.random() * 40 + Math.sin(i / 3) * 15,
      renewableShare: 40 + Math.random() * 30 + Math.cos(i / 4) * 20,
    });
  }
  return data;
};

type Theme = 'light' | 'dark' | 'system';

export default function App() {
  const [energyData] = useState(generateMockData());
  const [theme, setTheme] = useState<Theme>('system');
  const [menuVisible, setMenuVisible] = useState(false);
  const systemTheme = useColorScheme();

  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  const colors = isDark
    ? {
        background: '#121212',
        surface: '#1E1E1E',
        text: '#E0E0E0',
        textSecondary: '#A0A0A0',
        primary: '#90CAF9',
        chartLine: '#90CAF9',
        chartLine2: '#CE93D8',
        gridLine: '#333',
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
      'Zeitstempel,Marktpreis (EUR/MWh),Anteil Erneuerbarer (%)',
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
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              exportAsCSV();
              setMenuVisible(false);
            }}
          >
            <Text style={{ color: colors.text }}>📥 Export als CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              exportAsJSON();
              setMenuVisible(false);
            }}
          >
            <Text style={{ color: colors.text }}>📥 Export als JSON</Text>
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.gridLine }]} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setTheme('light');
              setMenuVisible(false);
            }}
          >
            <Text style={{ color: colors.text }}>☀️ Hell</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setTheme('dark');
              setMenuVisible(false);
            }}
          >
            <Text style={{ color: colors.text }}>🌙 Dunkel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setTheme('system');
              setMenuVisible(false);
            }}
          >
            <Text style={{ color: colors.text }}>📱 System</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <ScrollView style={styles.scrollView}>
        <SimpleChart
          title="Marktpreis (EUR/MWh)"
          data={energyData.map(d => d.marketPrice)}
          color={colors.chartLine}
          backgroundColor={colors.surface}
          textColor={colors.text}
          gridColor={colors.gridLine}
        />

        <SimpleChart
          title="Anteil Erneuerbarer Energien (%)"
          data={energyData.map(d => d.renewableShare)}
          color={colors.chartLine2}
          backgroundColor={colors.surface}
          textColor={colors.text}
          gridColor={colors.gridLine}
        />

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Korrelation: Preis vs. Erneuerbare
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Durchschnittlicher Preis
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {(energyData.reduce((sum, d) => sum + d.marketPrice, 0) / energyData.length).toFixed(2)} €/MWh
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Ø Erneuerbare
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {(energyData.reduce((sum, d) => sum + d.renewableShare, 0) / energyData.length).toFixed(1)} %
              </Text>
            </View>
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            💡 Höherer Anteil erneuerbarer Energien korreliert oft mit niedrigeren Preisen
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Datenquelle: SMARD.de (Bundesnetzagentur) • CC BY 4.0
        </Text>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Demo-Daten • Für Produktionsdaten API-Integration erforderlich
        </Text>
      </View>
    </SafeAreaView>
  );
}

// Simple Line Chart Component
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
  separator: {
    height: 1,
    marginVertical: 4,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 16,
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
    marginBottom: 16,
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
});
