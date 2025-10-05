# Energy Prices Germany - Cross-Platform PWA

Visualisierung von Energiemarktdaten für Deutschland mit React Native.

## 🎯 Features

- ✅ **Marktpreis-Chart**: Zeitlicher Verlauf des Day-Ahead-Preises
- ✅ **Anteil Erneuerbarer**: Visualisierung des Anteils erneuerbarer Energien
- ✅ **Korrelations-Statistiken**: Zusammenhang zwischen Preis und Erneuerbaren
- ✅ **Dark/Light/System Theme**: Anpassbares Erscheinungsbild
- ✅ **CSV/JSON Export**: Export der Energiedaten
- ✅ **PWA Support**: Installierbar auf mobilen Geräten und Desktop
- ✅ **Cross-Platform**: Android, iOS (experimentell) und Web

## 📱 Live Demo

**URL:** https://s540d.github.io/Energy_Price_Germany/

## 🚀 Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Android App starten
npm run android

# Web-Version starten
npm run web

# iOS starten (Mac + Xcode erforderlich)
npm run ios
```

## 🏗️ Build für Produktion

```bash
# Web/PWA Build
npm run build:web

# Ausgabe in dist/ Verzeichnis
```

## 📊 Datenquelle

**SMARD.de** (Bundesnetzagentur)
- Lizenz: CC BY 4.0
- Aktuell: Demo-Daten (Mock)
- Für echte Daten: API-Integration erforderlich

## 🎨 Technologie-Stack

- **React Native** - Cross-Platform Framework
- **Expo** - Build & Development Tools
- **React Native Web** - Web-Support
- **TypeScript** - Type Safety
- **PWA** - Progressive Web App Support

## 🔄 Migration vom Android-Projekt

Ursprünglich als natives Android-Projekt (Kotlin + Jetpack Compose) entwickelt.
Migriert zu React Native für:
- Einheitliche Codebasis für Android und Web
- PWA-Support
- Einfachere Wartung

Das Android-Projekt ist verfügbar unter `EnergyPriceGermany_android/`.

## 🌐 GitHub Pages Deployment

Das Projekt ist für automatisches Deployment konfiguriert:

1. **GitHub Pages aktivieren:**
   - Repository Settings → Pages
   - Source: "GitHub Actions"

2. **Automatisches Deployment:**
   - Bei jedem Push auf `main` Branch
   - GitHub Actions Workflow baut und deployed automatisch

3. **URL:**
   - `https://s540d.github.io/Energy_Price_Germany/`

## 📝 Lizenz

Datenquelle SMARD.de: CC BY 4.0 (Bundesnetzagentur)

## 🔮 Nächste Schritte

- [ ] SMARD API Integration (echte Daten)
- [ ] Erweiterte Chart-Bibliothek (Victory Native)
- [ ] Offline-Datenspeicherung
- [ ] Push-Benachrichtigungen für Preiswarnungen
- [ ] Historische Datenanalyse
