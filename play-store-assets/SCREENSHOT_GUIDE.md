# Screenshots für Google Play Store erstellen

**Ziel:** 2-8 hochwertige Screenshots der App für den Play Store

## 📋 Anforderungen

- **Anzahl:** Minimum 2, empfohlen 4-8
- **Format:** PNG oder JPEG
- **Größe:** Mind. 320px (kurze Seite), max. 3840px (lange Seite)
- **Seitenverhältnis:** 16:9 oder 9:16
- **Empfohlene Auflösung:** 1080x1920px (Portrait) oder 1920x1080px (Landscape)

---

## 🚀 Option 1: Web-App Screenshots (EMPFOHLEN - am einfachsten)

### Schritt 1: App im Browser öffnen

```bash
# Öffne die deployed App:
open https://s540d.github.io/Energy_Price_Germany/

# ODER: Starte lokale Entwicklungsversion:
npm start
# Dann öffne: http://localhost:19006
```

### Schritt 2: Browser in Mobil-Ansicht umstellen

**Chrome/Edge:**
1. Öffne DevTools (F12 oder Cmd+Opt+I auf Mac)
2. Klicke auf das Geräte-Symbol (Toggle device toolbar) oder Cmd+Shift+M
3. Wähle ein Gerät: "iPhone 12 Pro" oder "Pixel 5"
4. Stelle Zoom auf 100%

**Firefox:**
1. Öffne Developer Tools (F12)
2. Klicke auf "Responsive Design Mode" (Cmd+Opt+M)
3. Wähle "iPhone 12 Pro" oder stelle manuell 390x844px ein

### Schritt 3: Screenshots erstellen

**Wichtig:** Verwende die Browser-Screenshot-Funktion für perfekte Qualität!

**Chrome/Edge:**
```
1. Öffne DevTools (F12)
2. Cmd+Shift+P (Mac) oder Ctrl+Shift+P (Windows)
3. Tippe "Capture full size screenshot"
4. Enter drücken
→ Screenshot wird automatisch heruntergeladen
```

**Firefox:**
```
1. Rechtsklick auf der Seite
2. "Screenshot aufnehmen"
3. "Ganze Seite speichern" wählen
```

**Safari:**
```
1. Entwicklermenü aktivieren: Safari → Einstellungen → Erweitert → "Entwicklermenü anzeigen"
2. Entwicklung → Responsive Design Mode aktivieren
3. Gerät wählen
4. Normale macOS Screenshot-Funktion: Cmd+Shift+4 → Bereich auswählen
```

### Schritt 4: Empfohlene Screenshots

Erstelle Screenshots von folgenden Ansichten:

1. **Hauptansicht - Strompreis-Chart** (MUST-HAVE)
   - Zeigt Price Bar Chart mit aktuellen Daten
   - Chart sollte interessante Preisschwankungen zeigen
   - Ideal: Screenshot um 14-16 Uhr erstellen (wenn Day-Ahead Daten für nächsten Tag da sind)

2. **Renewable Share Chart** (MUST-HAVE)
   - Zeigt Ökostrom-Anteil im Zeitverlauf
   - Idealerweise mit hohen Werten (70-90%)

3. **Beide Charts zusammen** (EMPFOHLEN)
   - Komplette App-Ansicht
   - Zeigt Korrelation zwischen Preis und Ökostrom

4. **Dark Mode** (OPTIONAL)
   - Schalte in den Dark Mode um
   - Erstelle gleichen Screenshot wie oben

5. **Export-Funktion** (OPTIONAL, falls vorhanden)
   - Zeige Export-Menü oder -Dialog

6. **Settings/Info-Seite** (OPTIONAL)
   - Falls implementiert

---

## 🤖 Option 2: Android Emulator (für native App)

### Voraussetzung
```bash
# Android Studio installiert
# AVD (Android Virtual Device) eingerichtet
```

### Schritt 1: App im Emulator starten
```bash
npm run android
# Oder: eas build --platform android --profile preview
# Dann APK im Emulator installieren
```

### Schritt 2: Screenshot erstellen

**Methode A: Android Studio**
1. Öffne Android Studio
2. Tools → Device Manager
3. Wähle laufendes Gerät
4. Klicke auf Camera-Icon (📷)
5. Screenshot wird gespeichert

**Methode B: ADB Command**
```bash
adb shell screencap /sdcard/screenshot.png
adb pull /sdcard/screenshot.png ./play-store-assets/screenshot-01.png
```

**Methode C: Emulator-Buttons**
- Drücke Cmd+S (Mac) oder Ctrl+S (Windows) im Emulator
- Oder: Volume Down + Power (falls konfiguriert)

---

## 📱 Option 3: Reales Android-Gerät

### Schritt 1: App auf Gerät installieren
```bash
# APK erstellen und installieren
npm run android
# Oder APK direkt installieren falls vorhanden
```

### Schritt 2: Screenshots machen
1. App öffnen
2. **Volume Down + Power** gleichzeitig drücken
3. Screenshots werden in Galerie gespeichert

### Schritt 3: Screenshots auf PC übertragen
```bash
# Per USB-Kabel:
adb pull /sdcard/Pictures/Screenshots/ ./play-store-assets/

# Oder: Google Photos, Email, etc.
```

---

## 🎨 Screenshot-Tipps für beste Qualität

### Vorbereitung
- ✅ Stelle sicher, dass echte Daten geladen sind (nicht "Loading...")
- ✅ Wähle Zeitpunkt mit interessanten Daten (Preisschwankungen, hoher Ökostrom-Anteil)
- ✅ Entferne Debug-Overlays oder Test-Banner
- ✅ Prüfe, dass UI vollständig geladen ist (keine fehlenden Icons)

### Timing
- ✅ **Beste Zeit:** 14-16 Uhr - Day-Ahead Daten für nächsten Tag sind verfügbar
- ✅ Charts zeigen 24-48 Stunden Daten
- ✅ Interessante Preisspannen (nicht nur flache Linie)

### Qualität
- ✅ Keine Unschärfe oder verpixelte Bereiche
- ✅ Alle Texte lesbar
- ✅ Farben korrekt dargestellt
- ✅ Keine abgeschnittenen Elemente

### Dateinamen
Nutze aussagekräftige Namen:
```
screenshot-phone-01-main-chart.png
screenshot-phone-02-renewable-share.png
screenshot-phone-03-dark-mode.png
screenshot-phone-04-full-view.png
```

---

## 📐 Nachbearbeitung (optional)

Falls Screenshots nicht perfekt sind:

### Größe anpassen
```bash
# Mit ImageMagick (installieren: brew install imagemagick)
convert screenshot.png -resize 1080x1920 screenshot-resized.png
```

### Zuschneiden
```bash
convert screenshot.png -gravity center -crop 1080x1920+0+0 screenshot-cropped.png
```

### Komprimieren (falls > 8MB)
```bash
# Online-Tools:
# - https://tinypng.com
# - https://squoosh.app

# Oder mit ImageMagick:
convert screenshot.png -quality 90 screenshot-optimized.png
```

---

## ✅ Checkliste vor Upload

- [ ] Mindestens 2 Screenshots erstellt
- [ ] Screenshots zeigen aktuelle App-Version
- [ ] Alle Screenshots haben gleiche Ausrichtung (Portrait ODER Landscape)
- [ ] Dateigröße unter 8MB pro Screenshot
- [ ] Format: PNG (empfohlen) oder JPEG
- [ ] Keine Platzhalter-Daten sichtbar
- [ ] Screenshots in `play-store-assets/` gespeichert
- [ ] Dateinamen sinnvoll benannt

---

## 🎯 Empfohlene Screenshot-Set

**Minimal (2 Screenshots):**
1. Hauptansicht mit Price Chart
2. Renewable Share Chart

**Optimal (4-6 Screenshots):**
1. Hauptansicht - Price Bar Chart (Light Mode)
2. Renewable Share Chart (Light Mode)
3. Vollansicht mit beiden Charts
4. Dark Mode (Price Chart)
5. Dark Mode (Renewable Share)
6. Export-Funktion oder Info-Seite

---

## 🚨 Häufige Fehler vermeiden

❌ Screenshot mit "Loading..." Text
❌ Leere Charts (keine Daten)
❌ Debug-Overlays sichtbar
❌ Abgeschnittene UI-Elemente
❌ Verpixelte oder unscharfe Screenshots
❌ Falsches Seitenverhältnis
❌ Screenshots zu groß (> 8MB)

✅ Echte, interessante Daten
✅ Vollständig geladene UI
✅ Scharfe, hochauflösende Screenshots
✅ Konsistentes Design in allen Screenshots
✅ Optimale Dateigröße

---

## 📞 Hilfe benötigt?

Falls du Probleme hast:

1. **Web-Screenshots am einfachsten:** Nutze deployed App + Browser DevTools
2. **Qualität prüfen:** Öffne Screenshots und zoome rein - alles scharf?
3. **Automatisierung:** Script `create-screenshots.sh` nutzen (falls vorhanden)

Viel Erfolg! 🎉
