import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import type { ThemeColors } from '../utils/theme';
import { GITHUB_REPO_URL, PLAY_STORE_URL, playStoreUrlWithCampaign } from '../utils/appLinks';

interface AboutViewProps {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
  translations: {
    about: string;
    version: string;
    dataSource: string;
    dataLicense: string;
    appLicense: string;
    repository: string;
    supportSection: string;
    supportProject: string;
    rateApp: string;
    getAndroidApp: string;
    reportBug: string;
    noCommercialUse: string;
  };
  appVersion: string;
  dataSourceInfo: {
    name: string;
    license: string;
    url: string;
  };
}

export function AboutView({
  visible,
  onClose,
  colors,
  translations: t,
  appVersion,
  dataSourceInfo,
}: AboutViewProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.surface, borderBottomColor: colors.gridLine },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>{t.about}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.primary }]}>× Schließen</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          {/* App Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Energy Price Germany</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {t.version} {appVersion}
            </Text>
          </View>

          {/* Data Source */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.dataSource}</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {dataSourceInfo.name}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {t.dataLicense}: {dataSourceInfo.license}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const url = `https://${dataSourceInfo.url}`;
                if (Platform.OS === 'web') {
                  window.open(url, '_blank'); // platform-safe
                } else {
                  Linking.openURL(url);
                }
              }}
              style={styles.link}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>{dataSourceInfo.url}</Text>
            </TouchableOpacity>
          </View>

          {/* Regional Data Source */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Regional Data</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Energy Charts Signal API (Fraunhofer ISE)
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              License: CC BY 4.0
            </Text>
            <Text style={[styles.infoTextSmall, { color: colors.textSecondary }]}>
              Regional renewable energy share based on postal code (PLZ).
            </Text>
            <TouchableOpacity
              onPress={() => {
                const url = 'https://api.energy-charts.info';
                if (Platform.OS === 'web') {
                  window.open(url, '_blank'); // platform-safe
                } else {
                  Linking.openURL(url);
                }
              }}
              style={styles.link}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
                api.energy-charts.info
              </Text>
            </TouchableOpacity>
          </View>

          {/* App License */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.appLicense}</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Open Source • MIT License
            </Text>
            <Text style={[styles.infoTextSmallItalic, { color: colors.textSecondary }]}>
              {t.noCommercialUse}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const url = GITHUB_REPO_URL;
                if (Platform.OS === 'web') {
                  window.open(url, '_blank'); // platform-safe
                } else {
                  Linking.openURL(url);
                }
              }}
              style={styles.link}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>{t.repository}</Text>
            </TouchableOpacity>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.supportSection}</Text>

            <TouchableOpacity
              onPress={() => {
                const url = 'https://ko-fi.com/devsven';
                if (Platform.OS === 'web') {
                  window.open(url, '_blank'); // platform-safe
                } else {
                  Linking.openURL(url);
                }
              }}
              style={[
                styles.supportButton,
                { backgroundColor: colors.surface, borderColor: colors.gridLine },
              ]}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>{t.supportProject}</Text>
            </TouchableOpacity>

            {Platform.OS === 'android' && (
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL(PLAY_STORE_URL);
                }}
                style={[
                  styles.supportButton,
                  { backgroundColor: colors.surface, borderColor: colors.gridLine },
                ]}
              >
                <Text style={[styles.linkText, { color: colors.primary }]}>{t.rateApp}</Text>
              </TouchableOpacity>
            )}

            {/* Web visitors otherwise never learn that a Play Store app exists */}
            {Platform.OS === 'web' && (
              <TouchableOpacity
                onPress={() => {
                  // Campaign-tagged: these are the installs the web app actually generates
                  window.open(playStoreUrlWithCampaign('web_app', 'about'), '_blank'); // platform-safe
                }}
                style={[
                  styles.supportButton,
                  { backgroundColor: colors.surface, borderColor: colors.gridLine },
                ]}
              >
                <Text style={[styles.linkText, { color: colors.primary }]}>{t.getAndroidApp}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                const url =
                  'mailto:devsven@posteo.de?subject=Energy%20Price%20Germany%20-%20Bug%20Report';
                if (Platform.OS === 'web') {
                  window.open(url, '_blank'); // platform-safe
                } else {
                  Linking.openURL(url);
                }
              }}
              style={[
                styles.supportButton,
                { backgroundColor: colors.surface, borderColor: colors.gridLine },
              ]}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>{t.reportBug}</Text>
            </TouchableOpacity>
          </View>

          {/* Credits */}
          <View style={styles.footerSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  footerSpacer: {
    marginBottom: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  infoTextSmall: {
    fontSize: 12,
    marginTop: 4,
  },
  infoTextSmallItalic: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  link: {
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  supportButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
});
