import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StyleSheet, Text, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreenModule from 'expo-splash-screen';
import * as Updates from 'expo-updates';

import { getCurrentDataSource, energyDataManager } from './services/energyDataManager';
import { AboutView } from './components/AboutView';
import { SettingsMenu } from './components/settings/SettingsMenu';
import { CustomizeModal } from './components/customize/CustomizeModal';
import { CostCalculatorView } from './components/CostCalculatorView';
import { AppHeader } from './components/AppHeader';
import { ChartSection } from './components/ChartSection';
import { calculateMetrics } from './utils/metrics';
import { getThemeColors } from './utils/theme';
import { useEnergyData } from './hooks/useEnergyData';
import { useLanguageContext } from './context/LanguageContext';
import { useSettingsContext } from './context/SettingsContext';
import { checkPriceAlert } from './utils/priceAlertUtils';
import { usePriceAlertNotification } from './hooks/usePriceAlertNotification';
import { ChartSkeleton } from './components/ui/ChartSkeleton';
import { SplashScreen } from './components/ui/SplashScreen';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';

SplashScreenModule.preventAutoHideAsync().catch(() => {});

const APP_VERSION = '1.6.0';

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      SplashScreenModule.hideAsync().catch(() => {});
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  const [menuVisible, setMenuVisible] = useState(false);
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [priceClockView, setPriceClockView] = useState(false);
  const clockViewOpacity = useSharedValue(1);
  const isAnimatingClockView = useRef(false);

  const handlePriceClockViewChange = useCallback(
    (newValue: boolean) => {
      if (isAnimatingClockView.current || newValue === priceClockView) return;
      isAnimatingClockView.current = true;
      clockViewOpacity.value = withTiming(0, { duration: 120 }, () => {
        runOnJS(setPriceClockView)(newValue);
        clockViewOpacity.value = withTiming(1, { duration: 200 }, () => {
          runOnJS(() => {
            isAnimatingClockView.current = false;
          })();
        });
      });
    },
    [priceClockView, clockViewOpacity]
  );

  const clockViewAnimatedStyle = useAnimatedStyle(() => ({
    opacity: clockViewOpacity.value,
  }));

  const {
    theme,
    debouncedPostalCode,
    gridFees,
    priceAlertLow,
    priceAlertHigh,
    priceDisplayMode,
    historyCacheLimitMb,
  } = useSettingsContext();
  const { language, t } = useLanguageContext();
  const { energyData, loading } = useEnergyData(debouncedPostalCode);

  // Nutzer-Limit für die persistente Historie an den Daten-Manager weitergeben (#307)
  useEffect(() => {
    energyDataManager.setHistoryLimitBytes(historyCacheLimitMb * 1024 * 1024);
  }, [historyCacheLimitMb]);

  const systemTheme = useColorScheme();
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  const livePulseOpacity = useSharedValue(1);
  const livePulseStyle = useAnimatedStyle(() => ({ opacity: livePulseOpacity.value }));

  useEffect(() => {
    livePulseOpacity.value = withRepeat(
      withSequence(withTiming(0.2, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1
    );
    return () => cancelAnimation(livePulseOpacity);
    // livePulseOpacity is a stable shared value ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = colors.background;
    }
  }, [colors.background]);

  const filteredEnergyData = useMemo(() => {
    if (!energyData.length) return energyData;
    const past24h = Date.now() - 24 * 60 * 60 * 1000;
    return energyData.filter(item => item.timestamp >= past24h);
  }, [energyData]);

  const hasRegionalData = useMemo(
    () =>
      filteredEnergyData.some(
        item => item.renewableShareRegional !== null && item.renewableShareRegional !== undefined
      ),
    [filteredEnergyData]
  );

  const metrics = useMemo(() => calculateMetrics(filteredEnergyData), [filteredEnergyData]);

  const alertState = useMemo(
    () =>
      checkPriceAlert(
        metrics?.today?.endCustomerPrice?.current ?? null,
        priceAlertLow,
        priceAlertHigh
      ),
    [metrics, priceAlertLow, priceAlertHigh]
  );

  usePriceAlertNotification(
    alertState,
    t.priceAlertNotificationTitle,
    t.priceAlertNotificationLow,
    t.priceAlertNotificationHigh
  );

  const formatDate = useCallback(
    (timestamp: number) => {
      const locale = language === 'de' ? 'de-DE' : 'en-US';
      return new Date(timestamp).toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    [language]
  );

  const hourlyEnergyData = useMemo(() => {
    if (!filteredEnergyData.length) return filteredEnergyData;
    const buckets = new Map<number, typeof filteredEnergyData>();
    for (const d of filteredEnergyData) {
      const hourTs = Math.floor(d.timestamp / 3_600_000) * 3_600_000;
      if (!buckets.has(hourTs)) buckets.set(hourTs, []);
      const bucket = buckets.get(hourTs);
      if (bucket) bucket.push(d);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([hourTs, items]) => {
        const validPrice = items.filter(i => i.marketPrice !== null);
        const validRenewable = items.filter(i => i.renewableShare !== null);
        const avg = <T extends number | null>(arr: T[]): T =>
          (arr.length ? arr.reduce((s, v) => s + (v as number), 0) / arr.length : null) as T;
        return {
          timestamp: hourTs,
          marketPrice: validPrice.length ? avg(validPrice.map(i => i.marketPrice as number)) : null,
          renewableShare: validRenewable.length
            ? avg(validRenewable.map(i => i.renewableShare as number))
            : null,
          renewableShareRegional: (() => {
            const v = items.filter(
              i => i.renewableShareRegional !== null && i.renewableShareRegional !== undefined
            );
            return v.length ? avg(v.map(i => i.renewableShareRegional as number)) : undefined;
          })(),
          isMarketPriceInterpolated: items.some(i => i.isMarketPriceInterpolated),
          isRenewableShareInterpolated: items.some(i => i.isRenewableShareInterpolated),
        };
      });
  }, [filteredEnergyData]);

  const isDataStale = useMemo(() => {
    if (!filteredEnergyData.length) return false;
    const now = Date.now();
    const pastTimestamps = filteredEnergyData.map(d => d.timestamp).filter(ts => ts <= now);
    if (!pastTimestamps.length) return false;
    return now - Math.max(...pastTimestamps) > 2 * 60 * 60 * 1000;
  }, [filteredEnergyData]);

  useEffect(() => {
    async function checkAndApplyUpdates() {
      if (!__DEV__) {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        } catch {
          // Silently fail – app continues with current version
        }
      }
    }
    checkAndApplyUpdates();
  }, []);

  const getDataSourceInfo = useCallback(() => {
    const source = getCurrentDataSource();
    switch (source) {
      case 'energy-charts':
        return {
          name: 'Energy Charts (Fraunhofer ISE)',
          license: 'CC BY 4.0',
          url: 'api.energy-charts.info',
        };
      case 'awattar':
        return {
          name: 'aWATTar (EPEX Spot Market Data)',
          license: 'Proprietary',
          url: 'awattar.at',
        };
      default:
        return { name: 'Mock Data (Demo)', license: 'Generated', url: 'demo' };
    }
  }, []);

  if (loading) {
    return (
      <>
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
          edges={['top', 'left', 'right']}
        >
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <ScrollView
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={styles.skeletonScroll}
            scrollEnabled={false}
          >
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={styles.skeletonA11yText}
            >
              {t.loadingData}
            </Text>
            <ChartSkeleton />
          </ScrollView>
        </SafeAreaView>
        {showSplash && <SplashScreen onFinish={handleSplashFinish} version={APP_VERSION} />}
      </>
    );
  }

  return (
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right']}
      >
        {isDark && (
          <LinearGradient
            colors={['#0a0f1e', '#0d1a2e', '#0a1628']}
            locations={[0, 0.5, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            pointerEvents="none"
          />
        )}
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <AppHeader
          colors={colors}
          isDark={isDark}
          isDataStale={isDataStale}
          alertState={alertState}
          livePulseStyle={livePulseStyle}
          alertLowLabel={t.priceAlertActiveLow}
          alertHighLabel={t.priceAlertActiveHigh}
          onOpenCalculator={() => setCalculatorVisible(true)}
          onOpenSettings={() => setMenuVisible(true)}
        />

        <SettingsMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onOpenCustomize={() => setCustomizeVisible(true)}
          onOpenAbout={() => setAboutVisible(true)}
        />

        <CustomizeModal visible={customizeVisible} onClose={() => setCustomizeVisible(false)} />

        <ScrollView
          style={[
            styles.scrollView,
            { backgroundColor: isDark ? 'transparent' : colors.background },
          ]}
          contentContainerStyle={{
            flexGrow: 1,
            backgroundColor: isDark ? 'transparent' : colors.background,
            paddingBottom: 20,
          }}
          bounces={false}
        >
          <ChartSection
            filteredEnergyData={filteredEnergyData}
            hourlyEnergyData={hourlyEnergyData}
            metrics={metrics}
            colors={colors}
            isDark={isDark}
            debouncedPostalCode={debouncedPostalCode}
            hasRegionalData={hasRegionalData}
            gridFees={gridFees}
            priceDisplayMode={priceDisplayMode}
            priceClockView={priceClockView}
            clockViewAnimatedStyle={clockViewAnimatedStyle}
            formatDate={formatDate}
            handlePriceClockViewChange={handlePriceClockViewChange}
            t={t}
          />
        </ScrollView>

        <AboutView
          visible={aboutVisible}
          onClose={() => setAboutVisible(false)}
          colors={colors}
          translations={t}
          appVersion={APP_VERSION}
          dataSourceInfo={getDataSourceInfo()}
        />

        <CostCalculatorView
          visible={calculatorVisible}
          onClose={() => setCalculatorVisible(false)}
          priceData={filteredEnergyData
            .filter(item => item.marketPrice !== null)
            .map(item => ({
              start_timestamp: item.timestamp,
              marketprice: item.marketPrice ?? 0,
              renewable_share: item.renewableShare ?? undefined,
            }))}
          gridFees={gridFees}
        />
      </SafeAreaView>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} version={APP_VERSION} />}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonScroll: {
    flexGrow: 1,
  },
  skeletonA11yText: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
  scrollView: {
    flex: 1,
  },
});

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
