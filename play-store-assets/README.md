# Play Store Assets - Anforderungen

Dieser Ordner enthält alle grafischen Assets, die für die Veröffentlichung im Google Play Store benötigt werden.

## ✅ Bereits vorhanden (aus /assets)

Die folgenden Icons sind bereits in `/assets` vorhanden und können verwendet werden:
- `icon.png` - App-Icon
- `adaptive-icon.png` - Android Adaptive Icon
- `favicon.png` - Web-Favicon
- `splash-icon.png` - Splash Screen

## 📋 Noch zu erstellen für Play Store

### 1. App-Icon (High-Resolution)
**Dateiname:** `icon-512.png`
**Spezifikationen:**
- Größe: 512x512 Pixel
- Format: 32-bit PNG mit Alpha-Kanal
- Verwendung: Play Store Listing
- Hinweis: Kann aus vorhandenem `icon.png` skaliert werden

**Wie erstellen:**
```bash
# Mit ImageMagick (falls installiert):
convert ../assets/icon.png -resize 512x512 icon-512.png

# Oder mit Online-Tool:
# - https://www.photopea.com (kostenloser Online-Editor)
# - https://www.resizepixel.com
```

---

### 2. Feature Graphic (Werbebanner)
**Dateiname:** `feature-graphic.png`
**Spezifikationen:**
- Größe: 1024x500 Pixel
- Format: PNG oder JPEG
- Verwendung: Header im Play Store Listing
- Design: Sollte App-Name und Key Visual enthalten

**Design-Vorschlag:**
- Hintergrund: Farbverlauf oder energiebezogene Grafik
- Text: "Energy Prices Germany"
- Visuelle Elemente: Chart/Graph-Illustration, deutscher Strom-Bezug
- Farben: #4CAF50 (grün für erneuerbare Energien), #2196F3 (blau)

**Erstellen mit:**
- Canva (kostenloses Template)
- Figma
- Adobe Express
- GIMP/Photoshop

---

### 3. Screenshots (Telefon)
**Dateiname-Schema:** `screenshot-phone-01.png`, `screenshot-phone-02.png`, etc.
**Spezifikationen:**
- Anzahl: Minimum 2, empfohlen 4-8
- Format: PNG oder JPEG
- Mindestgröße: 320px (kürzere Seite)
- Maximalgröße: 3840px (längere Seite)
- Seitenverhältnis: 16:9 oder 9:16

**Empfohlene Screenshots:**
1. **Hauptansicht** - Chart mit Strompreisen
2. **Renewable Share Chart** - Anteil erneuerbarer Energien
3. **Korrelationsanalyse** - Beide Charts zusammen
4. **Datenexport** - Export-Funktion (falls vorhanden)
5. **Dark Mode** (optional) - Falls implementiert

**Wie erstellen:**
- Android Emulator nutzen (Android Studio)
- Reales Gerät Screenshots
- Screenshots beschriften mit Titeln/Features

---

### 4. Screenshots (7-Zoll-Tablet) - Optional
**Dateiname-Schema:** `screenshot-tablet7-01.png`, etc.
**Spezifikationen:** Gleich wie Phone, aber für 7" Tablets optimiert

---

### 5. Screenshots (10-Zoll-Tablet) - Optional
**Dateiname-Schema:** `screenshot-tablet10-01.png`, etc.
**Spezifikationen:** Gleich wie Phone, aber für 10" Tablets optimiert

---

## 🎨 Design-Richtlinien

### Farben (basierend auf App-Thema)
- Primär: #4CAF50 (Grün - Erneuerbare Energien)
- Sekundär: #2196F3 (Blau - Strom/Energie)
- Akzent: #FFC107 (Gelb/Gold - Preis)
- Hintergrund: #FFFFFF (Hell) / #121212 (Dunkel)

### Typografie
- Klar und lesbar
- Deutsch als Hauptsprache
- Evtl. Englisch als Sekundärsprache

---

## 📱 Screenshot-Workflow

### Option 1: Android Emulator (empfohlen)
```bash
# App im Emulator starten
npm run android

# Screenshot über Android Studio erstellen:
# Tools > Device Manager > Running Device > Screenshot Icon

# Oder über ADB:
adb shell screencap /sdcard/screenshot.png
adb pull /sdcard/screenshot.png ./play-store-assets/
```

### Option 2: Reales Gerät
- App auf Gerät installieren
- Screenshots machen (Power + Volume Down)
- Per USB auf PC übertragen

### Option 3: Screenshot-Tool
- Verwende Tools wie "Screenshot Easy" oder "Screen Master"
- Ermöglicht direktes Hinzufügen von Beschriftungen

---

## ✅ Checkliste vor Upload

- [ ] App-Icon 512x512px erstellt und optimiert
- [ ] Feature Graphic 1024x500px erstellt
- [ ] Mindestens 2 Phone-Screenshots erstellt
- [ ] Optional: Tablet-Screenshots erstellt
- [ ] Alle Bilder in korrekten Formaten (PNG/JPEG)
- [ ] Alle Bilder unter 8MB Dateigröße
- [ ] Screenshots zeigen aktuelle App-Version
- [ ] Keine Placeholder-Texte in Screenshots
- [ ] Feature Graphic ist ansprechend und informativ

---

## 🔗 Hilfreiche Tools

- **Android Asset Studio:** https://romannurik.github.io/AndroidAssetStudio/
- **Canva (Feature Graphic):** https://www.canva.com/
- **Photopea (Bildbearbeitung):** https://www.photopea.com/
- **TinyPNG (Komprimierung):** https://tinypng.com/
- **Figma (Design):** https://www.figma.com/

---

## 📝 Notizen

[Platz für projektspezifische Notizen]
