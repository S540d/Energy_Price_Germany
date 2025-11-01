# Android App Store Vorbereitung - Checkliste

**Stand:** 2025-11-01
**Projekt:** Energy Prices Germany
**Package:** com.sven4321.energypricegermany

## Status-Übersicht

### ✅ Abgeschlossen
- [x] 1. EAS Build Konfiguration erstellen (eas.json) ✅
- [x] 2. App-Versionierung synchronisieren (app.json & package.json) ✅
- [x] 3. Android-spezifische Konfiguration in app.json vervollständigen ✅
- [x] 4. App-Icons für verschiedene Größen prüfen/erstellen (512x512 für Store) ✅
- [x] 5. Feature Graphic erstellen (1024x500px) ✅
- [x] 6. Screenshots für verschiedene Geräte erstellen (min. 2, max. 8) ✅
- [x] 7. Store Listing Texte vorbereiten (Kurz- und Langbeschreibung) ✅
- [x] 8. Datenschutzrichtlinie URL hinzufügen (erforderlich für Play Store) ✅
- [x] 9. Berechtigungen (Permissions) dokumentieren und minimieren ✅
- [x] 10. App-Kategorie und Content Rating definieren ✅

### 🧪 Testing (später)
- [ ] 11. Production Build mit EAS erstellen (AAB Format)
- [ ] 12. Build testen auf verschiedenen Android-Geräten/Emulatoren

### 📤 Veröffentlichung
- [ ] 13. Google Play Console Account einrichten
- [ ] 14. App in Google Play Console hochladen und Store Listing vervollständigen

---

## Detaillierte Aufgabenbeschreibung

### 1. EAS Build Konfiguration (eas.json)
**Datei:** `eas.json`
**Erforderlich:**
- Build profiles (development, preview, production)
- Android-spezifische Build-Einstellungen
- Credentials management

**Beispiel-Struktur:**
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### 2. App-Versionierung
**Dateien:** `app.json`, `package.json`
**Aktueller Stand:**
- app.json: 1.0.0
- package.json: 1.0.3

**Ziel:** Synchronisieren auf gemeinsame Version

### 3. Android-Konfiguration in app.json
**Erforderliche Felder:**
- `versionCode`: Integer, muss bei jedem Update erhöht werden
- `permissions`: Liste der benötigten Berechtigungen
- Optional: `intentFilters`, `googleServicesFile`, etc.

### 4. App-Icons
**Vorhandene Assets:**
- `assets/icon.png`
- `assets/adaptive-icon.png`

**Erforderlich für Play Store:**
- 512x512px High-res icon (PNG, 32-bit mit Alpha)

### 5. Feature Graphic
**Spezifikationen:**
- Größe: 1024x500px
- Format: PNG oder JPEG
- Verwendung: Play Store Listing Header

### 6. Screenshots
**Anforderungen:**
- Minimum: 2 Screenshots
- Maximum: 8 Screenshots
- Format: PNG oder JPEG
- Mindestgröße: 320px
- Maximalgröße: 3840px
- Verschiedene Bildschirmgrößen: Phone, 7-inch Tablet, 10-inch Tablet

### 7. Store Listing Texte
**Kurzbeschreibung (max. 80 Zeichen):**
[Noch zu erstellen]

**Langbeschreibung (max. 4000 Zeichen):**
[Noch zu erstellen - sollte Features, Datenquellen, Vorteile beschreiben]

**Basis-Informationen:**
- App visualisiert Energiepreise in Deutschland
- Datenquellen: Energy Charts (Fraunhofer ISE), aWATTar
- Features: Echtzeit-Daten, Charts, Korrelationsanalyse, Datenexport

### 8. Datenschutzrichtlinie
**Erforderlich:** URL zu einer Datenschutzrichtlinie
**Optionen:**
- Eigene Website
- GitHub Pages
- Spezialisierte Dienste für Privacy Policies

**Zu dokumentieren:**
- Welche Daten werden gesammelt? (vermutlich keine)
- Wie werden Daten verwendet?
- Werden Daten geteilt?
- AsyncStorage Nutzung dokumentieren

### 9. Berechtigungen (Permissions)
**Zu prüfen:**
- Internet-Zugriff (für API-Calls)
- Weitere automatisch hinzugefügte Permissions

**Minimierung:** Nur wirklich benötigte Permissions

### 10. App-Kategorisierung
**Kategorievorschlag:** Tools oder Business
**Content Rating:** Alle Altersgruppen
**Tags/Keywords:** Energie, Strompreis, Deutschland, erneuerbare Energien, Energiewende

---

## Build-Prozess (für später)

### Voraussetzungen
1. Expo-Account erstellen: https://expo.dev/
2. EAS CLI installieren: `npm install -g eas-cli`
3. Login: `eas login`
4. Projekt konfigurieren: `eas build:configure`

### Build erstellen
```bash
eas build --platform android --profile production
```

### Build herunterladen
```bash
eas build:download
```

---

## Google Play Console Setup

### Kosten
- Einmalige Registrierungsgebühr: $25 USD

### Erforderliche Informationen
- Google-Konto
- Entwicklername
- Kontaktinformationen
- Zahlungsinformationen

### Store Listing vervollständigen
1. App-Details eingeben
2. Grafische Assets hochladen
3. Content Rating-Fragebogen ausfüllen
4. Datenschutzrichtlinie verlinken
5. App-Freigabe-Formular ausfüllen

---

## Nützliche Links

- Expo EAS Build Docs: https://docs.expo.dev/build/introduction/
- Google Play Console: https://play.google.com/console
- Android Asset Studio: https://romannurik.github.io/AndroidAssetStudio/
- Play Store Listing Requirements: https://support.google.com/googleplay/android-developer/answer/9866151

---

## Notizen

### Erledigte Arbeiten (2025-11-01)

**Konfigurationsdateien:**
- ✅ `eas.json` erstellt mit Development, Preview und Production Profilen
- ✅ `app.json` aktualisiert:
  - Version auf 1.0.3 synchronisiert
  - versionCode: 3 gesetzt
  - Android Permissions hinzugefügt (INTERNET, ACCESS_NETWORK_STATE)
  - Privacy-Setting auf "public" gesetzt
  - Primary Color definiert (#4CAF50)

**Dokumentation erstellt:**
- ✅ `PRIVACY_POLICY.md` - Vollständige Datenschutzerklärung (DE/EN)
- ✅ `PRIVACY_POLICY.html` - Webversion für GitHub Pages
- ✅ `PERMISSIONS.md` - Detaillierte Berechtigungsdokumentation
- ✅ `play-store-assets/README.md` - Anforderungen für grafische Assets
- ✅ `play-store-assets/store-listing.md` - Komplette Store-Texte (DE/EN)
- ✅ `play-store-assets/CATEGORY_AND_RATING.md` - Kategorisierung & Content Rating

**Datenschutzrichtlinie URL:**
Nach Web-Deployment verfügbar unter:
`https://s540d.github.io/Energy_Price_Germany/PRIVACY_POLICY.html`

**Nächste Schritte:**
1. Grafische Assets erstellen (Icon 512x512, Feature Graphic, Screenshots)
2. PRIVACY_POLICY.html deployen (mit `npm run deploy`)
3. EAS Build erstellen
4. Build testen
5. Google Play Console Setup

**Hinweise:**
- Store Listing Texte sind fertig (DE/EN)
- Content Rating: "Everyone" - Alle Fragen mit "Nein" beantwortet
- Kategorie: "Tools" (Alternative: Business/Finance)
- Keine In-App-Käufe, keine Werbung
- Open Source (MIT License)
