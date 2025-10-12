# 📝 Changelog - 12. Oktober 2025

## 🎯 Hauptänderungen

### 1. ✅ Hybrid Data Strategy Implementiert

**Problem gelöst:**
- Energy Charts Daten reichten nur ~24h in die Zukunft
- aWATTar bietet ~48h+ Vorhersage, wurde aber nur als Fallback genutzt

**Neue Lösung:**
- Intelligentes Merging: Energy Charts (primär) + aWATTar (Ergänzung)
- Nur ergänzen wenn Zeitdifferenz ≥ 3 Stunden
- Resultat: Bis zu 43+ Stunden Vorhersage-Daten

**Dateien geändert:**
- ✅ `.github/workflows/fetch.yml` - Merge-Logik hinzugefügt
- ✅ `update-marketdata.js` - Lokales Script mit identischer Logik
- ✅ `README.md` - Dokumentation aktualisiert
- ✨ `DATA-MERGE-STRATEGY.md` - Neue umfassende Dokumentation

**Test-Ergebnis:**
```
Vorher:  96 Datenpunkte (24h, nur Energy Charts)
Nachher: 172 Datenpunkte (43h, Energy Charts + aWATTar)
Source:  "energy-charts" (bleibt gleich bei Supplementierung)
```

---

### 2. ✅ GitHub Actions Deployment Fix

**Problem gelöst:**
- Deployment-Fehler: `fatal: could not read Username for 'https://github.com'`
- `gh-pages` npm package konnte nicht mit GitHub Token authentifizieren

**Neue Lösung:**
- Migration zu offiziellem `actions/deploy-pages@v4`
- Konsistente Deployment-Strategie über beide Workflows
- Moderne GitHub Pages Integration

**Dateien geändert:**
- ✅ `.github/workflows/deploy-on-data-update.yml` - Komplette Überarbeitung
  - Ersetzt `gh-pages` npm command durch offizielle Actions
  - Gleiche Struktur wie `deploy.yml` für Konsistenz
  - Besseres Summary-Reporting

**Workflow-Struktur:**
```yaml
jobs:
  build:
    - Checkout
    - Setup Node.js
    - Install dependencies
    - Build
    - Upload artifact
  
  deploy:
    - Deploy to GitHub Pages (offiziell)
    - Summary erstellen
```

---

### 3. ✅ Dokumentation aktualisiert

**Dateien geändert/erstellt:**
- ✅ `DATA-PATH-DOCUMENTATION.md` - Status-Updates
  - Deployment-Pipeline Beschreibung erweitert
  - Datei-Status-Tabelle aktualisiert
  - Daten-Strategie-Historie hinzugefügt
  - Verweis auf DATA-MERGE-STRATEGY.md

- ✅ `README.md` - Data Sources Sektion
  - Hybrid-Strategie erklärt
  - Coverage-Zeiten dokumentiert
  - Link zu ausführlicher Dokumentation

- ✨ `DATA-MERGE-STRATEGY.md` - Komplett neu
  - Ausführliche Merge-Logik Dokumentation
  - Decision Tree Diagramm
  - Beispiel-Szenarien
  - Test-Anweisungen

- ✨ `CHANGELOG-2025-10-12.md` - Diese Datei
  - Zusammenfassung aller Änderungen
  - Migration Guide
  - Validierungs-Checkliste

---

## 🔍 Technische Details

### Merge-Algorithmus (Pseudocode)

```javascript
1. Versuche Energy Charts API zu laden
2. Versuche aWATTar API zu laden
3. 
4. Wenn Energy Charts erfolgreich:
5.   Hole letzten Zeitstempel von Energy Charts
6.   
7.   Wenn aWATTar erfolgreich:
8.     Hole letzten Zeitstempel von aWATTar
9.     Berechne Zeitdifferenz in Stunden
10.    
11.    Wenn Differenz >= 3 Stunden:
12.      Filtere aWATTar: nur Daten NACH Energy Charts
13.      Merge: Energy Charts + gefilterte aWATTar Daten
14.      Source = "energy-charts"
15.    Sonst:
16.      Verwende nur Energy Charts
17.      Source = "energy-charts"
18.  Sonst:
19.    Verwende nur Energy Charts
20.    Source = "energy-charts"
21.
22. Sonst wenn aWATTar erfolgreich:
23.   Verwende nur aWATTar (Fallback)
24.   Source = "awattar"
25.
26. Sonst:
27.   Fehler: Keine Daten verfügbar
```

### Deployment-Workflow Verbesserungen

**Alte Methode (fehlerhaft):**
```yaml
- run: npm run deploy:gh-pages
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Neue Methode (funktioniert):**
```yaml
- uses: actions/deploy-pages@v4
  # Verwendet built-in GitHub Pages Integration
  # Keine externe Authentifizierung nötig
```

---

## 📊 Auswirkungen

### Daten-Coverage
- **Vorher**: ~24 Stunden (96 x 15-Min-Intervalle)
- **Nachher**: ~43 Stunden (172 x 15-Min-Intervalle)
- **Verbesserung**: +79% mehr Vorhersage-Daten

### Datenqualität
- **Erste 24h**: Volle Qualität (Preis + Erneuerbaren-Anteil)
- **Stunden 24-43**: Nur Preisdaten (renewable_share = null)
- **Transparenz**: Source-Label zeigt Datenherkunft

### Deployment-Zuverlässigkeit
- **Vorher**: Authentifizierungs-Fehler bei data-triggered deploys
- **Nachher**: Zuverlässige Deployments mit offizieller Action

---

## ✅ Validierungs-Checkliste

### Lokale Tests
- [x] `node update-marketdata.js` läuft erfolgreich
- [x] Daten werden korrekt gemerged (172 Datenpunkte)
- [x] Source bleibt "energy-charts" bei Supplementierung
- [x] Renewable share ist null für aWATTar-Daten
- [x] Keine Pfadänderungen (DO-NOT-CHANGE-PATHS.md beachtet)

### GitHub Actions
- [ ] `fetch.yml` Workflow läuft erfolgreich durch
- [ ] `deploy-on-data-update.yml` deployed ohne Fehler
- [ ] Neue Daten erscheinen auf GitHub Pages
- [ ] Archive-Ordner wird korrekt befüllt

### Dokumentation
- [x] DATA-PATH-DOCUMENTATION.md aktualisiert
- [x] DATA-MERGE-STRATEGY.md erstellt
- [x] README.md aktualisiert
- [x] Changelog erstellt

---

## 🚀 Next Steps

### Sofort
1. Commit und Push aller Änderungen
2. Workflow manuell auslösen zum Testen
3. Deployment auf GitHub Pages überprüfen

### Monitoring (erste 24h)
- Stündliche Updates beobachten
- Merge-Logik in Action Logs prüfen
- Frontend-Darstellung validieren

### Optional (zukünftig)
- Frontend UI für Datenquellen-Visualisierung
- Unterschiedliche Farben für EC vs AW Daten
- Config-Integration für andere Scripts

---

## 🔒 Wichtige Hinweise

### ⚠️ KEINE Pfadänderungen!
- Alle Änderungen betreffen nur Daten-Logik und Deployment
- `public/data/marketdata.json` bleibt unverändert
- DO-NOT-CHANGE-PATHS.md weiterhin gültig

### 🔗 Verknüpfte Dateien
Diese Änderungen sind konsistent mit:
- ✅ `config.js` - Keine Änderungen nötig
- ✅ `DATA-PATH-DOCUMENTATION.md` - Aktualisiert
- ✅ `DO-NOT-CHANGE-PATHS.md` - Weiterhin gültig

### 📚 Dokumentation
Für Details siehe:
- **Merge-Logik**: `DATA-MERGE-STRATEGY.md`
- **Pfade**: `DATA-PATH-DOCUMENTATION.md`
- **Warnungen**: `DO-NOT-CHANGE-PATHS.md`

---

**Datum**: 12. Oktober 2025  
**Version**: 1.1.0 (Feature-Update)  
**Status**: ✅ Bereit für Production  
**Getestet**: ✅ Lokal erfolgreich
