# Data Merge Strategy - Ideale Architektur

## Empfohlene Struktur

```
scripts/
├─ fetch-data.js          # API-Fetching (getrennt von Logik)
├─ merge-market-data.js   # Kern-Merge-Logik (refactored)
├─ enrich-renewable.js    # Renewable-Anreicherung
└─ validate-data.js       # Datenvalidierung

.github/workflows/
└─ fetch.yml              # Nur Orchestrierung, kein Inline-Code
```

## Kern-Prinzipien

### 1. Single Responsibility
- **Fetching**: Nur API-Aufrufe, keine Logik
- **Merging**: Nur Datenstruktur-Kombination
- **Enrichment**: Nur Datenanreicherung
- **Validation**: Nur Qualitätsprüfung

### 2. Datenfluss

```javascript
// 1. Fetch alle Datenquellen
const ecPrices = await fetchEnergyChartsPrices();
const ecRenewable = await fetchEnergyChartsRenewable(); // ← Länger als Preise!
const awPrices = await fetchAwattarPrices();

// 2. Erstelle einheitliche Datenstruktur
const ecData = mergeECPricesWithRenewable(ecPrices, ecRenewable);
const awData = interpolateToQuarterHour(awPrices);

// 3. Reichere aWATTar mit EC-Renewable an
const enrichedAW = enrichWithRenewable(awData, ecRenewable);

// 4. Kombiniere basierend auf Zeitstempeln
const finalData = combineDataSources(ecData, enrichedAW);

// 5. Merge mit History
const withHistory = preserveHistory(finalData, existingData);

// 6. Validiere
validateDataIntegrity(withHistory);
```

### 3. Wichtige Erkenntnisse

**Energy Charts API liefert:**
- **Preise**: Nur für heute (96 Punkte = 24h in 15-min)
- **Renewable Forecast**: Für heute + morgen (192 Punkte = 48h in 15-min)

**Das bedeutet:**
- Renewable-Daten reichen WEITER als Preisdaten
- aWATTar kann mit EC-Renewable angereichert werden
- Es gibt immer eine "Lücke" nach EC-Preisen, die aWATTar füllt

### 4. Vereinfachter Merge-Algorithmus

```javascript
function createFinalDataset(ecPrices, ecRenewable, awPrices) {
  // 1. Index alle EC-Renewable
  const renewableMap = indexByTimestamp(ecRenewable);

  // 2. EC-Preise mit Renewable mergen
  const ecData = ecPrices.map(p => ({
    ...p,
    renewable_share: renewableMap.get(p.timestamp) || null
  }));

  // 3. aWATTar interpolieren UND anreichern
  const awData = interpolateAwattar(awPrices).map(p => ({
    ...p,
    renewable_share: renewableMap.get(p.timestamp) || null
  }));

  // 4. Nur aWATTar nach EC-Preisen nehmen
  const lastECTimestamp = ecData[ecData.length - 1].end_timestamp;
  const supplemental = awData.filter(d => d.start_timestamp >= lastECTimestamp);

  // 5. Kombinieren
  return [...ecData, ...supplemental];
}
```

### 5. GitHub Action (vereinfacht)

```yaml
- name: Fetch and merge data
  run: |
    node scripts/fetch-all-sources.js
    node scripts/merge-and-enrich.js
    node scripts/validate-output.js

- name: Commit if changed
  run: |
    if ! git diff --quiet public/data/marketdata.json; then
      git add public/data/marketdata.json
      git commit -m "Update market data"
      git push
    fi
```

### 6. Testbarkeit

```javascript
// Unit Tests
describe('enrichWithRenewable', () => {
  it('should add renewable data when timestamp matches', () => {
    const awData = [{ start_timestamp: 1000, renewable_share: null }];
    const renewableMap = new Map([[1000, 45.5]]);
    const result = enrichWithRenewable(awData, renewableMap);
    expect(result[0].renewable_share).toBe(45.5);
  });
});
```

## Migration von aktueller zu idealer Lösung

1. **Phase 1**: Extrahiere Inline-Code aus fetch.yml in separate Dateien
2. **Phase 2**: Erstelle einheitliche API-Fetch-Module
3. **Phase 3**: Implementiere Tests
4. **Phase 4**: Aktualisiere update-marketdata.js (importiert Shared-Module)
5. **Phase 5**: Dokumentation aktualisieren

## Aktuelle Schwachstellen

1. **renewable_map.json als Zwischendatei** → Sollte im Memory bleiben
2. **Inline JavaScript in YAML** → Schwer zu debuggen/testen
3. **Compare-Logik zu komplex** → Git-basierter Vergleich einfacher
4. **Keine Fehlerbehandlung** → Was passiert bei API-Timeouts?
5. **Keine Retry-Logik** → Wenn EC einmal fehlschlägt, keine zweite Chance

## Empfehlung

Die aktuelle Lösung funktioniert, aber:
- **Kurzfristig**: Dokumentation aktualisieren (DATA-MERGE-STRATEGY.md)
- **Mittelfristig**: Code aus fetch.yml extrahieren in separate JS-Module
- **Langfristig**: Tests hinzufügen, Retry-Logik implementieren
