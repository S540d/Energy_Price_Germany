import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useLanguageContext } from '../../context/LanguageContext';
import { getThemeColors } from '../../utils/theme';
import { useSettingsContext } from '../../context/SettingsContext';
import { HISTORY_CACHE_LIMIT_OPTIONS_MB } from '../../hooks/useSettings';
import { historicalDataStore, type HistoryStorageInfo } from '../../services/historicalDataStore';

/**
 * Cache-Einstellung für historische Daten (Issue #307).
 * Nutzer wählt die Speicher-Obergrenze (MB), sieht den belegten Speicher
 * und kann den Verlauf-Cache leeren.
 */
export function HistoryCacheSection() {
  const { t } = useLanguageContext();
  const { theme, historyCacheLimitMb, setHistoryCacheLimitMb } = useSettingsContext();
  const systemTheme = useColorScheme();
  const colors = useMemo(() => getThemeColors(theme, systemTheme || 'light'), [theme, systemTheme]);

  const [info, setInfo] = useState<HistoryStorageInfo | null>(null);

  const refreshInfo = useCallback(async () => {
    const storageInfo = await historicalDataStore.getStorageInfo();
    setInfo(storageInfo);
  }, []);

  useEffect(() => {
    refreshInfo();
  }, [refreshInfo]);

  const handleClear = useCallback(async () => {
    await historicalDataStore.clear();
    await refreshInfo();
  }, [refreshInfo]);

  const usedLabel = useMemo(() => {
    const bytes = info?.totalBytes ?? 0;
    const mb = bytes / (1024 * 1024);
    const sizeStr = mb >= 0.1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
    const days = info?.dayCount ?? 0;
    return `${sizeStr} · ${days} ${days === 1 ? t.historyCacheDay : t.historyCacheDays}`;
  }, [info, t]);

  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {t.historyCacheTitle}
      </Text>
      <Text style={[styles.hint, { color: colors.textTertiary }]}>{t.historyCacheHint}</Text>

      <View style={styles.toggle}>
        {HISTORY_CACHE_LIMIT_OPTIONS_MB.map(mb => (
          <TouchableOpacity
            key={mb}
            style={[
              styles.toggleButton,
              {
                backgroundColor: historyCacheLimitMb === mb ? colors.primary : colors.gridLine,
              },
            ]}
            onPress={() => setHistoryCacheLimitMb(mb)}
          >
            <Text
              style={{
                color: historyCacheLimitMb === mb ? '#fff' : colors.text,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {mb} MB
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.usedText, { color: colors.textSecondary }]}>
          {t.historyCacheUsed}: {usedLabel}
        </Text>
        <TouchableOpacity onPress={handleClear} disabled={(info?.dayCount ?? 0) === 0}>
          <Text
            style={[
              styles.clearButton,
              { color: (info?.dayCount ?? 0) === 0 ? colors.textTertiary : colors.error },
            ]}
          >
            {t.historyCacheClear}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 11,
    marginTop: -4,
  },
  toggle: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usedText: {
    fontSize: 12,
  },
  clearButton: {
    fontSize: 12,
    fontWeight: '600',
  },
});
