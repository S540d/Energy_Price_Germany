# Android App Links für Energy Price Germany

## Status: ✅ Verifiziert

Die Android App Links für Energy Price Germany sind korrekt konfiguriert und vom Play Store verifiziert.

## Zentrale Verwaltung

Die `assetlinks.json` wird **zentral** im Root-Repository verwaltet:

**Repository:** [S540d.github.io](https://github.com/S540d/S540d.github.io)
**Live URL:** https://s540d.github.io/.well-known/assetlinks.json

## Konfiguration

### App-Details
- **Package Name:** `com.sven4321.energypricegermany`
- **SHA-256 Fingerprint:** `CE:E0:C0:38:E3:E7:74:17:2E:33:7A:D3:36:3E:F2:16:E3:1B:C1:0E:94:B2:C5:96:E9:A7:BD:1C:CB:64:DD:EF`

### Intent Filter (app.json)
```json
{
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          {
            "scheme": "https",
            "host": "s540d.github.io",
            "pathPrefix": "/Energy_Price_Germany"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

## Wichtig

⚠️ **Keine lokale assetlinks.json mehr!**

Die `public/.well-known/assetlinks.json` wurde entfernt, da Android App Links die Datei immer am **Root der Domain** suchen (`https://s540d.github.io/.well-known/assetlinks.json`), nicht im Subpath.

## Bei Änderungen

Falls der SHA-256 Fingerprint aktualisiert werden muss:

1. Gehe zu [S540d.github.io Repository](https://github.com/S540d/S540d.github.io)
2. Bearbeite `.well-known/assetlinks.json`
3. Aktualisiere den Fingerprint für `com.sven4321.energypricegermany`
4. Commit und Push (GitHub Pages deployed automatisch)

## Verifizierung testen

```bash
# assetlinks.json abrufen
curl https://s540d.github.io/.well-known/assetlinks.json

# Deep Link testen (mit adb)
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://s540d.github.io/Energy_Price_Germany" \
  com.sven4321.energypricegermany
```

## Weitere Infos

Siehe [Eisenhauer/ANDROID_APP_LINKS.md](../Eisenhauer/ANDROID_APP_LINKS.md) für eine umfassende Anleitung zu Android App Links.
