# Auffindbarkeit (Discoverability)

Wie Interessenten die App finden können — und was im Repo dafür sorgt. Die Play-Store-Suche ist
nur einer von mehreren Wegen; die GitHub-Pages-Seite ist für viele Besucher der erste Kontakt.

## Der Trichter

```
Google-Suche / geteilter Link / GitHub
        ↓
https://s540d.github.io/Energy_Price_Germany/   (Web-App, PWA)
        ↓
Google Play (Android-Installation)
```

Ohne Verweise auf den Play Store endet dieser Trichter bei der Web-App: Besucher installieren die
PWA (oder nutzen sie nur im Browser) und tauchen in der Play Console nie auf.

## Was im Repo dafür sorgt

| Ort | Zweck |
| --- | --- |
| `public/index.html` — Title/Description/Keywords | Deutschsprachige Suchbegriffe (Strompreis heute, Börsenstrompreis, Day-Ahead, dynamischer Stromtarif, Ökostrom-Anteil) |
| `public/index.html` — `canonical`, `robots` | Eindeutige URL, Indexierung erlaubt |
| `public/index.html` — Open Graph / Twitter Cards | Link-Vorschau in WhatsApp, Mastodon, Reddit, Slack … |
| `public/index.html` — JSON-LD `SoftwareApplication` | Verknüpft Seite und Play-Store-Listing (`installUrl`/`downloadUrl`) |
| `public/index.html` — `<noscript>`-Block | Die App rendert per JavaScript; Crawler ohne JS-Ausführung sehen sonst keinen Inhalt |
| `public/index.html` — Store-Banner-Skript | Android-Besucher erfahren, dass es eine Play-Store-App gibt (einmalig, wegklickbar) |
| `public/manifest.json` — `related_applications` | Verknüpft PWA und Android-App |
| `public/robots.txt`, `public/sitemap.xml` | Für die Einreichung in der Google Search Console (nur im Production-Build, siehe `scripts/post-build.js`) |
| `README.md` | Play-Store- und Web-Link direkt am Anfang |
| `components/AboutView.tsx` | Play-Store-Link auch in der Web-Version |
| `utils/appLinks.ts` | Einzige Quelle für Store-/Repo-URLs (verhindert tote Links durch abweichende Paket-IDs) |

**Wichtig:** `public/index.html` ist die tatsächliche Produktions-Vorlage. Expo Web injiziert beim
Export nur die Script-Tags und das Favicon in diese Datei — Änderungen an den Meta-Tags landen
direkt auf GitHub Pages. `scripts/post-build.js` darf den Title deshalb nicht überschreiben.

## Manuelle Schritte (nicht im Repo automatisierbar)

1. **Google Search Console:** Property `https://s540d.github.io/Energy_Price_Germany/` ist über
   `public/google8097e00b29377c58.html` verifiziert. Dort
   `https://s540d.github.io/Energy_Price_Germany/sitemap.xml` einreichen und die Startseite per
   "URL-Prüfung → Indexierung beantragen" anstoßen.
2. **GitHub-Repo-Metadaten:** Repo-Description, Website-Feld (auf die Web-App) und Topics setzen
   (z.B. `strompreis`, `electricity-prices`, `energiewende`, `day-ahead`, `epex-spot`,
   `renewable-energy`, `react-native`, `expo`, `pwa`). Topics sind eine eigenständige
   Suchoberfläche auf GitHub.
3. **Play-Store-Listing:** Kurz-/Langbeschreibung und Keywords siehe `docs/STORE_DESCRIPTION.md`.
4. **Backlinks:** Erwähnungen in einschlägigen Communities (Foren zu dynamischen Stromtarifen,
   PV/Speicher, Wallbox) sind für eine Projektseite der wirksamste Rankingfaktor.

## Messen, ob der Trichter wirkt (Play-Console-Attribution)

Alle Web→Store-Links tragen eine Kampagnen-Kennung, damit in der Play Console sichtbar wird,
wie viele Installationen tatsächlich über die Web-App kommen.

**Format ist entscheidend:** Google Play wertet die UTM-Werte **nur** aus, wenn sie in einem
einzigen, URL-kodierten `referrer`-Parameter stehen. Direkt angehängte `utm_source=`/`utm_medium=`
sind für Play bedeutungslose Query-Parameter und tauchen in keinem Report auf:

```
# wirkungslos
…/details?id=<pkg>&utm_source=web_app&utm_medium=banner

# korrekt
…/details?id=<pkg>&referrer=utm_source%3Dweb_app%26utm_medium%3Dbanner%26utm_campaign%3Dwebapp
```

Die Kampagne erscheint danach in der Play Console unter **Nutzergewinnung** (Acquisition
reports). Dafür ist **keine** Install-Referrer-API im App-Code nötig — die braucht man nur,
wenn die App den Wert selbst lesen soll.

| Einstiegspunkt | `utm_medium` |
| --- | --- |
| Android-Banner auf der Web-App | `banner` |
| `<noscript>`-Block | `noscript` |
| "Über"-Dialog der Web-App | `about` |
| README auf GitHub (`utm_source=github`) | `readme` |

Gemeinsame `utm_campaign=webapp`, damit alle Einstiegspunkte in einer Report-Zeile aggregieren
und trotzdem nach `utm_medium` aufschlüsselbar bleiben. Gebaut wird die URL in
`utils/appLinks.ts` (`playStoreUrlWithCampaign`); `public/index.html` muss dieselben Werte
hartkodieren, weil das Web-Template nichts importieren kann.

Bewusst **ohne** Kampagnen-Parameter:
- **JSON-LD `installUrl`/`downloadUrl`/`sameAs`** — Structured Data soll auf die kanonische
  Listing-URL zeigen.
- **Der "Im Play Store bewerten"-Link in der Android-App** — dort ist die App bereits installiert,
  es gibt nichts zu attribuieren.

## Bekannte Grenzen von GitHub Pages (Projektseite)

- **`robots.txt` wird nur unter `https://s540d.github.io/robots.txt` gelesen** — also im Repository
  `s540d.github.io`, nicht in diesem Projekt-Unterpfad. Die ausgelieferte
  `/Energy_Price_Germany/robots.txt` ignorieren Crawler daher; sie schadet nicht, ersetzt aber
  nicht die Sitemap-Einreichung in der Search Console (siehe oben).
- **Digital Asset Links** (`/.well-known/assetlinks.json`) müssen ebenfalls in der Domain-Wurzel
  liegen. Die `autoVerify`-Intent-Filter in `app.json` können auf einer Projektseite daher nicht
  verifiziert werden (`scripts/post-build.js` sucht die Datei, findet sie nicht — das ist erwartbar).
- Beides ließe sich mit einer eigenen Domain lösen.

## Optional: Android-Installationen priorisieren

`public/manifest.json` enthält `"prefer_related_applications": false`. Auf `true` gesetzt, bietet
Chrome auf Android statt der PWA-Installation die Play-Store-App an (Desktop bleibt bei der PWA,
da dort keine passende Plattform in `related_applications` steht). Das erhöht die Play-Store-
Installationen, nimmt Android-Nutzern aber die Möglichkeit, die PWA zu installieren.
