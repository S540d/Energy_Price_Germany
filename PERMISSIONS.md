# Android App Berechtigungen (Permissions)

## Übersicht

Diese Dokumentation erklärt alle Android-Berechtigungen, die die App "Energy Prices Germany" verwendet.

## Deklarierte Berechtigungen

Die folgenden Berechtigungen sind in `app.json` unter `expo.android.permissions` deklariert:

### 1. INTERNET
**Typ:** Normal Permission (wird automatisch gewährt)

**Zweck:**
- Abrufen von aktuellen Energiepreisdaten von externen APIs
- Laden von Marktdaten für Day-Ahead Preise
- Abrufen von Daten zum Anteil erneuerbarer Energien

**Verwendete APIs:**
- Energy Charts (Fraunhofer ISE): `https://api.energy-charts.info`
- aWATTar: `https://api.awattar.de`

**Datenschutz:**
Es werden keine personenbezogenen Daten übertragen. Die App sendet nur anonyme HTTP/HTTPS-Anfragen für öffentliche Marktdaten.

---

### 2. ACCESS_NETWORK_STATE
**Typ:** Normal Permission (wird automatisch gewährt)

**Zweck:**
- Überprüfen, ob eine Internetverbindung verfügbar ist
- Unterscheiden zwischen Online- und Offline-Modus
- Vermeiden von Fehlerversuchen bei fehlender Verbindung
- Anzeige entsprechender Nutzer-Feedback bei Offline-Zustand

**Technische Details:**
Die App nutzt dies, um:
- Netzwerkstatus abzufragen bevor API-Calls gemacht werden
- Cached Daten anzuzeigen wenn offline
- Nutzer über fehlende Verbindung zu informieren

---

## Nicht verwendete Berechtigungen

Die App verwendet **NICHT** die folgenden häufig angefragten Berechtigungen:

❌ **WRITE_EXTERNAL_STORAGE** - Keine Speicherung auf externem Speicher
❌ **READ_EXTERNAL_STORAGE** - Kein Zugriff auf Dateien
❌ **ACCESS_FINE_LOCATION** - Keine Standortdaten
❌ **ACCESS_COARSE_LOCATION** - Keine Standortdaten
❌ **CAMERA** - Keine Kamerazugriff
❌ **RECORD_AUDIO** - Keine Audioaufnahmen
❌ **READ_CONTACTS** - Kein Zugriff auf Kontakte
❌ **WRITE_CONTACTS** - Kein Zugriff auf Kontakte
❌ **READ_PHONE_STATE** - Kein Zugriff auf Telefonstatus
❌ **CALL_PHONE** - Keine Telefonfunktion
❌ **READ_SMS** - Kein Zugriff auf SMS
❌ **SEND_SMS** - Kein Versenden von SMS
❌ **GET_ACCOUNTS** - Kein Zugriff auf Konten
❌ **BLUETOOTH** - Keine Bluetooth-Nutzung
❌ **NFC** - Keine NFC-Nutzung

---

## Minimalprinzip

Die App folgt dem **Prinzip der Datenminimierung**:
- Nur absolut notwendige Berechtigungen werden angefordert
- Keine gefährlichen Berechtigungen (Dangerous Permissions)
- Keine Runtime-Berechtigungsanfragen
- Alle Berechtigungen sind "Normal Permissions" und werden bei Installation automatisch gewährt

---

## Für Entwickler: Konfiguration

### app.json
```json
{
  "expo": {
    "android": {
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    }
  }
}
```

### Automatisch hinzugefügte Berechtigungen

Expo und React Native können automatisch weitere Berechtigungen hinzufügen. Um dies zu verhindern, sind in `app.json` nur die minimal notwendigen Berechtigungen explizit deklariert.

**Blockierte automatische Berechtigungen:**
Durch die explizite Deklaration werden nur die genannten Berechtigungen verwendet. Andere werden nicht automatisch hinzugefügt.

---

## Play Store Darstellung

### Berechtigungs-Kategorien im Play Store

**Netzwerk-Zugriff:**
- INTERNET: Vollständiger Netzwerkzugriff
- ACCESS_NETWORK_STATE: Netzwerkverbindungen abrufen

**Erklärung für Nutzer (Play Store Listing):**
> Diese App benötigt Internetzugriff, um aktuelle Energiepreise und Daten zu erneuerbaren Energien abzurufen. Es werden keine persönlichen Daten übertragen oder gespeichert.

---

## Sicherheitsüberprüfung

### Google Play Protect
Die App verwendet nur "Normal Permissions", daher:
- ✅ Keine Sicherheitswarnungen
- ✅ Keine zusätzlichen Nutzerbestätigungen erforderlich
- ✅ Schnellere Überprüfung durch Google Play

### Data Safety Section (Play Store)
Angaben für die "Data Safety" Sektion im Play Store:

**Datenerfassung:**
- ❌ Keine Daten werden erfasst

**Datenweitergabe:**
- ❌ Keine Daten werden geteilt

**Sicherheitspraktiken:**
- ✅ Daten werden während der Übertragung verschlüsselt (HTTPS)
- ✅ Nutzer kann Datenlöschung beantragen (durch App-Deinstallation)

---

## Changelog

### Version 1.0.3 (2025-11-01)
- Initial Release
- Berechtigungen: INTERNET, ACCESS_NETWORK_STATE

---

## Kontakt

Bei Fragen zu Berechtigungen:
- **GitHub Issues:** https://github.com/S540d/Energy_Price_Germany/issues
- **Datenschutz:** Siehe PRIVACY_POLICY.md

---

## Referenzen

- [Android Permissions Docs](https://developer.android.com/guide/topics/permissions/overview)
- [Expo Permissions Configuration](https://docs.expo.dev/versions/latest/config/app/#permissions)
- [Google Play Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469)
