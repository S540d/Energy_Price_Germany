# Changelog - Energy Price Germany

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Datenlücken melden per Issue statt per rotem Run (Issue #445, Retrospektive).** Der `Data health check` setzte bei fehlenden Erneuerbaren-Daten `exit 1` und färbte den Run rot — der Benachrichtigungsweg aus #417. Nebenwirkung: **Rot wurde mehrdeutig**, entweder Upstream-Ausfall (gewollt) oder echter Defekt. Genau daran ist #445 durchgerutscht: Ein Step, der in *jedem* Run mit Exit 9 abbrach, sah aus wie „der Alarm tut, was er soll", und blieb über Stunden unentdeckt. Der Befund landet jetzt in einem automatisch verwalteten Issue (Label `data-health`): öffnen bei Lücke, höchstens ein Kommentar pro Berlin-Tag bei Fortdauer, Kommentar + Schließen bei Erholung — über `GITHUB_TOKEN`, ohne Webhook oder Secret. Der Verlauf ist damit sogar besser nachvollziehbar als per Einzelmail. **Seither gilt wieder: rot = Defekt.** Die Prüf-Semantik ist unverändert (DE 0 Punkte für heute = Alarm, aWATTar und Beta-Länder = nur Warnung); ein Fehler der Alarmierung selbst färbt den Run bewusst nicht rot, da die Daten zu dem Zeitpunkt bereits committet sind. 6 zusätzliche Unit-Tests.
- **Fetch-Pipeline: Resilienz, mehr Erholungschancen, Alarmierung (Issue #435, schließt #417).** Am 02.09.2026 antwortete `ren_share_forecast?country=de` mit HTTP 429; der Workflow lief **grün** durch, die App zeigte trotzdem 10 Stunden lang "Erneuerbare: --". Drei Ursachen, drei Gegenmaßnahmen:
  - **Neues `scripts/fetch-energy-charts.sh`** bündelt die vorher 14-fach duplizierten `curl`-Aufrufe (2 Endpunkte × 7 Länder). Statt des fixen `--retry-delay 5` jetzt **exponentielles Backoff (5 s / 15 s / 45 s)** und ein respektierter **`Retry-After`-Header** (bei 429/503, gedeckelt auf 60 s) – drei 5-Sekunden-Versuche gegen ein minutenlang haltendes Rate-Limit liefen zuvor wirkungslos ins Leere. Retry-würdig sind HTTP 429/5xx sowie curl-Exit 7/28/35/52/55/56; alles andere bricht sofort ab. Zusätzlich **Payload-Validierung per `jq`**, die den stummen Ausfall "HTTP 200 mit leeren Arrays" abfängt und die Datei nach dem letzten Fehlversuch löscht, statt still `null`-Werte zu schreiben. `price` bleibt required, `ren_share_forecast` non-fatal. Diagnose je Land (HTTP-Code, Versuchszahl, Punktezahlen) landet im Job-Summary.
  - **6 statt 3 Cron-Slots** (`0 3,6,9,13,16,19 * * *`) mit datenbasiertem Gate: 03 und 13 UTC laufen immer, die vier übrigen nur, wenn zwei billige DE-Probe-Calls eine Verbesserung zeigen (neue Preis-Abdeckung **oder** mehr Erneuerbaren-Punkte für heute als in der committeten Datei). Ersetzt die Commit-Message-Heuristik aus #406, die nur prüfte, *ob* committet wurde – nicht, *ob Daten fehlen*, und den Fallback im 429-Fall fälschlich übersprungen hätte. Laufzeit bleibt mit ~3 min/Tag praktisch gleich, bei doppelt so vielen Erholungschancen.
  - **Neuer `Data health check`** als letzter Step (`if: always()`, also nach dem Commit – Daten werden in jedem Fall veröffentlicht): 0 Erneuerbaren-Punkte für heute (Europe/Berlin) in DE färben den Run rot und lösen GitHubs "workflow run failed"-Mail aus. Das ist der in #417 gesuchte Benachrichtigungsweg ohne zusätzliche Infrastruktur. aWATTar-Fallback und Beta-Länder mit 0 Punkten erzeugen nur Warnungen.

### Documentation
- **`CLAUDE.md`: Release-Workflow korrigiert (Session vom 02.09.2026).** Der Release von #435 legte mehrere falsche bzw. fehlende Annahmen offen, die jedes künftige Release betroffen hätten:
  - **Squash-only verhinderte die Branch-Ancestry.** Weil jeder PR gesquasht wurde, war `main` nie Vorfahre von `testing`; Git meldete daraufhin Phantom-Konflikte in `fetch.yml`/`CHANGELOG.md`/`CLAUDE.md`, der Release-Diff zeigte **339 statt 9** Dateien, und der Release-PR bekam als konfliktbehafteter PR **gar keine CI-Checks** (`mergeable_state: dirty`, `total_count: 0`) – was leicht als CI-Defekt fehlgedeutet wird. Neu dokumentiert: Sync-PRs `main → testing` müssen als **Merge-Commit** gemergt werden, inkl. Prüfbefehlen und der 405-Fehlermeldung, falls „Allow merge commits" deaktiviert ist.
  - **Der pauschale „bei `fetch.yml`-Konflikten immer die `main`-Seite nehmen"-Rat ist überholt** – seit diesem Release ist `testing` die Obermenge. Ersetzt durch eine Marker-Zählung, die misst statt rät.
  - **Die Behauptung, `git push` scheitere in Remote-Sessions grundsätzlich mit 403 („kein SSH-Key"), ist falsch.** Pushes auf Feature-Branches funktionieren; auf `testing`/`main` lehnt das **Ruleset** ab (`GH013 – Changes must be made through a pull request`). Der Unterschied entscheidet über den richtigen Workaround (PR-Weg statt MCP-API).
  - **#428 als erledigt markiert**, inkl. der eigentlichen Lehre: Die `deletion`-Regel existierte längst, war aber durch einen `bypass_actor` mit `bypass_mode: "always"` wirkungslos. Beim Release am 02.09. erstmals im Ernstfall bestätigt – `testing` überlebte den Merge.
  - **Neuer Diagnose-Fallstrick:** Eine sinkende Gesamtzahl der Erneuerbaren-Punkte ist kein Datenverlust – `marketdata.json` ist ein rollierendes Fenster fester Größe (767 Punkte). Maßgeblich ist die Zahl der Punkte **für heute (Europe/Berlin)**, nicht die Gesamtzahl.
  - Doppelt vorhandenen Abschnitt „Deploy (Unified): transienter TLS-Fehler" entfernt.

### Security
- **npm audit (Issue #352):** `brace-expansion` (high, ReDoS) via `npm audit fix` behoben; `uuid` (moderate, fehlende Buffer-Bounds-Prüfung, transitiv über `xcode`/`@expo/config-plugins`) per `overrides` auf `^11.1.1` gepinnt, ohne Expo zu downgraden (`npm audit fix --force` hätte fälschlich `expo@46` vorgeschlagen). Verbleibend: `image-size` (high, DoS via Endlosschleife beim Parsen), transitiv über `metro`/`@react-native/community-cli-plugin` – laut `npm audit` sind aktuell **alle** veröffentlichten `image-size`-Versionen (inkl. `2.0.2`) betroffen, es existiert noch kein Fix stromaufwärts; betrifft nur den lokalen Build-Prozess (Metro-Bundler), nicht den ausgelieferten Code. Insgesamt 15 → 4 Vulnerabilities (10 moderate, 5 high → 4 high).

### Added
- **Workflow-Linting (Issue #445, Retrospektive):** Zwei Checks im neuen CI-Job `⚙️ Workflow Linting` plus Pre-Commit-Hook, weil sie unterschiedliche Fehlerklassen abdecken:
  - **`actionlint` + `shellcheck`** für allgemeine Workflow- und Shell-Fehler, Severity ab `warning`. Bewusst gefiltert: die 48 info-Findings in `fetch.yml` (SC2086/SC2012/SC2016) sind Stilhinweise und sollen den Merge nicht blockieren — mit `-S warning` ist der aktuelle Stand sauber.
  - **`scripts/lint-workflows.js`** (neu) für genau die Fehlerklasse aus #445, **die actionlint nicht findet**. Nachgemessen: Gegen die fehlerhafte Fassung (Commit `9abdda2`) meldet shellcheck 48 Findings — kein einziges auf dem Bug. Grund: Ein Apostroph im Body eines `node -e '…'`-Blocks ist für die Shell *syntaktisch korrekt*, aus einem String werden nur mehrere Wörter. Der Fehler ist semantisch (`node` bekommt `--` als Option). Der Guard meldet Apostrophe im Body als Fehler und mehrzeilige `node -e`-Blöcke als Konventionsverstoß (Logik gehört nach `scripts/`). Verifiziert: findet in der alten Fassung genau einen Fehler an der richtigen Stelle (Zeile 2533), im aktuellen Stand keinen. Abgesichert durch 6 Unit-Tests.
- **Frische-Signal `public/data/status.json` (Retrospektive zu #445/#446).** Die Frage „läuft die Pipeline gerade?" war bisher nur durch manuelles Log-Lesen zu beantworten — der Run-Status taugte nicht dafür: **grün** bewies nicht, dass Daten ankamen (aWATTar-Fallback ohne Erneuerbaren-Daten, HTTP 200 mit leeren Arrays), **rot** war zwischen Upstream-Ausfall und echtem Defekt nicht unterscheidbar. `status.json` beantwortet sie in einer Datei: je Land Quelle, Punktezahl, Erneuerbaren-Punkte für heute (Europe/Berlin), Abdeckungsfenster und Alter der jüngsten Daten. Wird mit den Daten ausgeliefert, ist also auch aus Browser und App abrufbar. Geschrieben von `scripts/write-status.js` an derselben Bedingung wie der Commit — `generatedAt` ist damit der Zeitpunkt des letzten *tatsächlichen* Daten-Updates; ein eigener Commit nur für `status.json` würde den „keine neuen Daten"-Fall zu einem Daten-Commit machen und die Loop-Guards in `deploy-unified.yml` stören. `coverageAgeHours` ist bei Day-Ahead-Preisen normalerweise **negativ** (Abdeckung reicht in die Zukunft) — genau das ist das gesunde Signal. 5 Unit-Tests.
- **Hinweis bei eingeschränkten Erneuerbaren-Daten (Issue #417):** Liefert die API `renewable_share` für den aktuellen Tag komplett leer (z.B. HTTP 200 mit leerem Array, wie am 31.08.2026 beobachtet – kein Fehler, kein Fallback-Trigger), zeigt der Erneuerbaren-Chart jetzt ein Overlay "Weitere Daten sind aktuell nicht verfügbar", statt kommentarlos leer zu bleiben. Preis-Chart und übrige App sind unbeeinflusst. Neues `metrics.today.coverage` (`priceCount`/`renewableCount`/`total`) in `utils/metrics.ts` macht Teilausfälle einzelner Metriken sichtbar.
- **Chart-Zoom (Issue #355):** `PriceBarChart`, `RenewableBarChart` und `CorrelationScatterChart` (inkl. Detail-Modal `ChartDetailView`) unterstützen jetzt Pinch-to-Zoom (mobil) bzw. Scroll-to-Zoom (Web), um einzelne Stunden bei 48h-/7d-Ansichten besser erkennbar zu machen. Neuer gemeinsamer Hook `useChartZoom` (`components/charts/shared/`); die Y-Achsen-Beschriftung bleibt beim Scrollen fixiert, ein Reset-Badge erscheint bei aktivem Zoom.
- **Auffindbarkeit außerhalb des Play Stores:** Die GitHub-Pages-Seite ist die naheliegendste Direktquelle für Interessenten, hat aber weder den Play Store verlinkt noch für Suchmaschinen verwertbaren Inhalt geliefert – Besucher wurden zu PWA-Nutzern statt zu Play-Store-Installationen.
  - **SEO-Meta in `public/index.html`:** deutschsprachiger Title und Description mit relevanten Suchbegriffen (Strompreis heute, Börsenstrompreis, Day-Ahead, dynamischer Stromtarif, Ökostrom-Anteil), `keywords`, `canonical`, erweiterte Open-Graph- und neue Twitter-Card-Tags für Link-Vorschauen in Messengern/Social Media.
  - **Structured Data (JSON-LD `SoftwareApplication`)** mit `installUrl`/`downloadUrl` auf den Play Store, damit Google Seite und App-Listing verknüpfen kann.
  - **Indexierbarer `<noscript>`-Inhalt:** Die App rendert komplett per JavaScript – Crawler ohne JS-Ausführung sahen bisher nur "You need to enable JavaScript". Jetzt gibt es eine deutschsprachige Kurzbeschreibung inkl. Feature-Liste und Play-Store-Link.
  - **Play-Store-Hinweis für Android-Besucher:** dezentes, wegklickbares Banner am unteren Rand (nur Android-Browser, nicht in der installierten PWA; Dismiss wird gemerkt).
  - **`related_applications`** im Web-App-Manifest (plus `id`, `lang`, `categories`, deutschsprachige Description); `prefer_related_applications` bleibt auf `false` – auf `true` gesetzt würde Chrome auf Android die Play-Store-App statt der PWA-Installation anbieten.
  - **Web-App verlinkt den Play Store** in "Über" (`AboutView`); bisher war der Eintrag Android-only.
  - **`public/sitemap.xml`** um die Datenschutzerklärung ergänzt, Play-Store-Link in der README, neue Übersicht `docs/DISCOVERABILITY.md` (inkl. der manuellen Schritte in Search Console / GitHub-Repo-Metadaten).

### Fixed
- **`Data health check` brach in jedem Fetch-Run mit `node: bad option: --` ab (Issue #445).** Der Step aus #435 war als `node -e '…'`-Inline-Block geschrieben; der deutsche Fehlertext enthielt mit `die App zeigt 'Erneuerbare: --'` ein Apostroph-Paar, das die einfachen Shell-Quotes vorzeitig schloss. `node` bekam dadurch `--` als Option und beendete sich mit Exit 9 – **bevor** irgendeine Prüfung lief. Effekt: Der Health-Check war seit seiner Einführung wirkungslos und färbte stattdessen **jeden** Run rot, unabhängig von der Datenlage (Runs 33652243129, 33690118651). Damit war der Alarmweg aus #417 faktisch tot – ein dauerhaft roter Run ist nicht von einem echten Ausfall unterscheidbar. Die Logik liegt jetzt in `scripts/data-health-check.js` (analog zu `scripts/fetch-energy-charts.sh` aus #435); der Workflow ruft nur noch `node scripts/data-health-check.js` auf, wodurch die Shell-Quoting-Fehlerklasse an dieser Stelle komplett entfällt. Semantik unverändert (DE 0 Punkte für heute = fatal, aWATTar und Beta-Länder = nur Warnung), jetzt abgesichert durch 6 Unit-Tests in `scripts/__tests__/data-health-check.test.js`.
- **Frisch geholte Erneuerbaren-Daten wurden nicht committet (`fetch.yml`):** Direkte Folge des Fixes darunter und dessen zweite Hälfte – ohne diese Änderung blieb die Website trotz funktionierendem Fetch auf dem alten Stand. Der Schritt `Compare with previous data` entschied allein anhand von `max(start_timestamp)`, ob committet wird. Nach einem aWATTar-Fallback reicht der Datensatz aber bereits bis zum Ende des Folgetages, sodass ein späterer erfolgreicher Energy-Charts-Lauf denselben höchsten Zeitstempel liefert (`OLD_TS == NEW_TS`) und samt seiner Erneuerbaren-Werte verworfen wurde – beobachtet in Run 33332831834: 96 Renewable-Punkte geholt, „Final dataset: 739 points, source: energy-charts", danach `new_data=false` und kein Commit. Die Erkennung berücksichtigt jetzt zusätzlich die Anzahl der Datenpunkte mit `renewable_share != null` (alle sieben Länder). Bewusst nur bei **Zunahme**: ein Rückgang bedeutet einen Fallback ohne Erneuerbaren-Daten und darf vorhandene Werte nicht überschreiben; ein Wechsel von `source` allein ist aus demselben Grund kein Auslöser. `OLD_REN`/`NEW_REN` werden mitgeloggt.
- **Veraltete Erneuerbaren-Daten auf der Website (`fetch.yml`):** Die Kachel "Erneuerbare jetzt" zeigte "--" und "Tages-Ø 0.0%", während die Preise aktuell waren – `renewable_share` endete rund 22h in der Vergangenheit. Ursache war nicht ein fehlgeschlagener Workflow (alle Runs waren grün), sondern der greifende aWATTar-Fallback, der per Design keine Erneuerbaren-Daten liefert. Zwei Auslöser: (1) Die ersten ausgehenden Verbindungen eines frischen Runners liefen in einen Connect-Hang gegen `api.energy-charts.info` (`curl: (28) … after 134449 ms`), betroffen waren DE und NL als erste Länder-Blöcke, während derselbe Host Sekunden später für AT/CH/FR/BE sofort antwortete. (2) DE und NL behandelten `ren_share_forecast` als fatal (`|| exit 1`), im Gegensatz zu allen anderen Ländern (`|| true`) – ein Ausfall dieses einen Endpunkts verwarf damit auch die validen Day-Ahead-Preise. Alle API-Calls nutzen jetzt gemeinsame `CURL_OPTS` (`--connect-timeout 15 --retry 3 --retry-delay 5 --retry-all-errors`; `--retry-all-errors` deckt neben Timeouts auch "couldn't connect" ab, das `--retry` allein nicht wiederholt), und DE/NL behandeln den Renewable-Forecast wie die übrigen Länder als optional. Der aWATTar-Fallback bleibt als letzte Instanz erhalten, wird aber nicht mehr durch einen einzelnen transienten Verbindungsfehler ausgelöst.
- **Tooltip saß neben dem Balken statt darauf:** In `PriceBarChart` und `RenewableBarChart` fehlte bei der x-Berechnung des Tooltips das `rightPadding` in der Plot-Breite, während Balken, `NowMarker` und Achsenlabels es berücksichtigen. Der Tooltip-Marker driftete dadurch zum rechten Chartrand hin um bis zu `rightPadding` von dem Balken weg, den er beschreibt. Alle Charts nutzen jetzt dieselbe Skalierungsfunktion.
- **Play-Store-Kampagnen-Attribution wirkungslos:** Die Web→Store-Links trugen `utm_source`/`utm_medium` direkt als Query-Parameter an der Store-URL – Google Play wertet UTM-Werte aber nur aus, wenn sie in einem einzigen, URL-kodierten `referrer`-Parameter stehen (`&referrer=utm_source%3D…%26utm_medium%3D…%26utm_campaign%3D…`). In der Play Console wäre nie eine einzige Installation dem Web-Trichter zugeordnet worden. Alle Einstiegspunkte (Android-Banner, `<noscript>`, "Über"-Dialog der Web-Version, README) nutzen jetzt das korrekte Format mit gemeinsamer `utm_campaign=webapp` und unterscheidbarem `utm_medium`; gebaut über `playStoreUrlWithCampaign()` in `utils/appLinks.ts`. JSON-LD (`installUrl`/`downloadUrl`) und der In-App-Bewerten-Link bleiben bewusst ohne Parameter.
- **Toter Play-Store-Link in der App:** Der "Im Play Store bewerten"-Button verwies auf die Paket-ID `de.svenstroh.energypricegermany` statt auf `com.sven4321.energypricegermany`. Alle App-Links liegen jetzt zentral in `utils/appLinks.ts`.
- **`scripts/post-build.js` überschrieb den SEO-Title** der Produktions-Seite mit dem generischen `Energy Prices Germany`; der Title aus `public/index.html` bleibt jetzt erhalten (Fallback nur, wenn gar kein Title vorhanden ist).
- **Play Store: Large-Screen-Kompatibilität (Issue #381):** `orientation` in `app.config.js` (der eigentlich aktiven Config-Quelle, `app.json` wurde bereits ignoriert) von `portrait` auf `default` korrigiert. Neuer Config-Plugin `plugins/withAndroidResizeableActivity.js` setzt `android:resizeableActivity="true"` auf die MainActivity beim `expo prebuild` (das generierte, gitignorete `AndroidManifest.xml` kann nicht direkt gepatcht werden).
- **Titel-Überlauf bei „Anteil erneuerbare Energien..." (Issue #355):** Chart-Titel in `PriceBarChart`, `RenewableBarChart` und `CorrelationScatterChart` brechen jetzt bei Bedarf zweizeilig um (`numberOfLines={2}`, `flex: 1`) statt auf kleinen Bildschirmen abgeschnitten zu werden.
- **Potenzielle App-Abstürze (Issue #376):** Zwei verifizierte Absturzquellen behoben, die zum "App ist im Mai zweimal abgestürzt"-Report im Play Store passen (kein Stacktrace verfügbar):
  - **`Math.min(...array)`/`Math.max(...array)`-Spread** in `utils/metrics.ts`, `App.tsx`, `utils/chartUtils.ts` und den drei Chart-Komponenten (`PriceBarChart`, `RenewableBarChart`, `CorrelationScatterChart`) durch schleifenbasierte `arrayMin`/`arrayMax`-Helfer (`utils/mathUtils.ts`) ersetzt. Der Spread-Ansatz kann bei ungewöhnlich großen Arrays (z.B. durch einen Datenmerge-Bug oder lange Verlaufs-Zeiträume) einen `RangeError: Maximum call stack size exceeded` werfen – die neuen Helfer haben keine Obergrenze.
  - **`react-native-worklets`-Versionskonflikt:** `package.json` pinnte `0.7.2`, während `expo-modules-core` (gebündelt mit Expo 55) `^0.7.4 || ^0.8.0` verlangt – npm löste dadurch zwei divergierende native Kopien der Bibliothek auf (root `0.7.2` vs. verschachtelt `0.8.1` unter `expo`). Auf `0.8.1` vereinheitlicht, sodass nur noch eine native Modul-Kopie existiert.

### Changed
- **Chart-Koordinatenmathematik zentralisiert:** Neues Modul `components/charts/shared/chartScale.ts` (`scaleToX`, `scaleToY`, `getPlotWidth`, `getPlotHeight`, `getBarWidth`, `getBarHeight`). Die bisher an acht Stellen in `PriceBarChart`, `RenewableBarChart`, `CorrelationScatterChart` und `NowMarker` kopierte Projektionsformel liegt jetzt an einer Stelle – inklusive Schutz gegen `NaN` bei leerem Wertebereich (ein Datenpunkt bzw. lauter identische Werte). 18 neue Unit-Tests.
- **ESLint `eqeqeq`** auf `{ null: 'ignore' }` gestellt. Das bisher als Error gemeldete `!= null` in `ChartSection.tsx` ist bewusst so geschrieben (fängt `null` *und* `undefined`); ein Umbau auf `!==` hätte `undefined + gridFees` zu `NaN` gemacht.

### Removed
- **Toter Code:** `utils/dataInterpolation.ts` (+ Test) entfernt – die Exporte waren nur noch vom eigenen Test referenziert. Die Interpolation passiert inzwischen in der Datenpipeline; die App liest lediglich das `interpolated`-Flag aus `marketdata.json`.
- **Ungenutzte devDependencies:** `@babel/preset-env`, `@babel/preset-flow`, `@babel/preset-react`, `@babel/preset-typescript` entfernt. `babel.config.js` nutzt ausschließlich `babel-preset-expo`, das preset-react, preset-typescript und Flow-Stripping selbst mitbringt.

### Performance
- **Fetch-Prozess optimiert (Issue #406):** `fetch.yml` läuft nicht mehr fix 3x täglich, sondern hat einen neuen `gate`-Job vor dem eigentlichen Fetch. Rückblickende Auswertung der Commit-Historie (`git log -- public/data/marketdata.json`) zeigte ein stabiles Muster: der Primärlauf um 13:00 UTC (~1h nach dem Beginn der Day-Ahead-Datenverfügbarkeit) bringt praktisch immer neue Daten. Der bisher fix um 14:00 UTC laufende zweite Fetch wurde durch einen Fallback um 19:00 UTC (6h später) ersetzt, der nur ausgeführt wird, wenn der Primärlauf laut Commit-Historie *keine* neuen Daten geliefert hat (geprüft anhand des Zeitstempels in der letzten Commit-Message). Reduziert unnötige API-Calls/Actions-Minuten an Tagen, an denen der Primärlauf bereits vollständig war.
- **Pre-Aggregierung für die 30-Tage-Ansicht (Issue #334):** Die tägliche History-Pipeline (`fetch.yml`, alle Länder) erzeugt jetzt zusätzlich eine stündlich vorab-aggregierte `<date>-hourly.json` Variante (~75% kleiner) pro Tag. `historicalDataStore.getRange()` lädt für die 30-Tage-Ansicht in `HistoricalDataView` bevorzugt diese Variante nach (mit automatischem Fallback auf die volle Auflösung, falls sie fehlt) – deutlich weniger Downloadvolumen, da diese Ansicht ohnehin clientseitig auf Tages-Buckets aggregiert dargestellt wird.

## [1.9.0] - 2026-06-27

### Added
- **Europäische Datenexpansion – Phase 1 (Issue #368):** Österreich 🇦🇹 und Schweiz 🇨🇭 als neue Länder (BETA) im Länder-Picker. Nationale Börsenpreise + Erneuerbaren-Anteile von Energy Charts.
  - **Länder-Registry** (`utils/countries.ts`) um `at`/`ch` erweitert (eigene Zeitzone Vienna/Zurich, Datenpfade `data/<code>/`, kein Regional-/PLZ-UI, kein aWATTar).
  - **i18n** (DE/EN): `countryAustria`, `countrySwitzerland`.
  - **Datenpipeline** (`.github/workflows/fetch.yml`): AT-/CH-Blöcke (Fetch → Process → Validate → Compare → Archive + History → Cleanup), `sleep 5` als Rate-Limit-Schutz, `ren_share_forecast` non-fatal (429 → skip, Preis bleibt nutzbar).
- **Europäische Datenexpansion – Phase 2 (Issue #368):** Frankreich 🇫🇷, Belgien 🇧🇪 und Dänemark 🇩🇰 als neue Länder (BETA) im Länder-Picker. Nationale Börsenpreise + Erneuerbaren-Anteile von Energy Charts.
  - **Länder-Registry** (`utils/countries.ts`) um `fr`/`be`/`dk` erweitert (eigene Zeitzone Paris/Brüssel/Kopenhagen, Datenpfade `data/<code>/`, kein Regional-/PLZ-UI, kein aWATTar).
  - **i18n** (DE/EN): `countryFrance`, `countryBelgium`, `countryDenmark`.
  - **Datenpipeline** (`.github/workflows/fetch.yml`): FR-/BE-/DK-Blöcke nach dem AT/CH-Muster, Commit- und Summary-Schritte ergänzt.

## [1.8.1] - 2026-06-25

### Fixed
- **Falsche (deutsche) Daten bei den Niederlanden nach App-Neustart** – Race-Condition beim Start: der noch laufende Default-DE-Ladevorgang lieferte seine Daten an die NL-Anfrage zurück. Der In-flight-Dedup im Daten-Manager ist jetzt nach Land + PLZ gescoped.

## [1.8.0] - 2026-06-25

### Added
- **Europäische Datenexpansion – Niederlande (Issue #356):** Neuer Länder-Umschalter (🇩🇪/🇳🇱) im „Personalisieren"-Modal. Für die Niederlande werden nationale Börsenpreise + Erneuerbaren-Anteile von Energy Charts angezeigt (BETA).
  - **Länder-Registry** (`utils/countries.ts`) als Single Source of Truth: Datenpfade, Zeitzone, `hasRegionalData`-Flag, Default-Netzentgelte – neue Länder = ein Registry-Eintrag.
  - **CountryContext + useCountry-Hook** mit Persistenz (unabhängig von der UI-Sprache).
  - Für Länder ohne Regionaldaten (NL) wird die **PLZ-/Regional-Sektion ausgeblendet**.
  - **NL-Datenpipeline** in `.github/workflows/fetch.yml`: holt `?country=nl` von Energy Charts (kein aWATTar), Output unter `public/data/nl/`.
  - **History-Store länder-namespaced**: getrennte Storage-Keys + Server-Fallback-Pfade pro Land.

### Fixed
- **„Verlauf" zeigte im NL-Modus einen DE/NL-Mix** – die Verlauf-Ansicht liest jetzt aus dem länder-korrekten History-Store des aktiven Landes.

---

## [1.5.3] - 2026-04-06

### Fixed
- **Button-Sizing im Detail-Modal** – `style`-Prop (z.B. `flex: 1`, `minHeight`) wird jetzt korrekt auf den inneren `Animated.View` übertragen, sodass der Button-Hintergrund den gesamten zugewiesenen Bereich füllt
- **Footer-Buttons Abstand** – `marginLeft`-Hack durch konsistentes `gap: 12` auf dem Container ersetzt (einheitlich mit dem Rest der Codebase)

### Security
- **flatted 3.4.1 → 3.4.2** – Prototype Pollution Vulnerability behoben (GHSA-rf6f-7fwh-wjgh)

---

## [1.5.2] - 2026-03-15

### Fixed
- **Share-Button auf iOS Safari** – "Diagramm teilen" funktioniert jetzt auch auf iOS-Webversion (Fallback von `toPng` auf `toCanvas` + Data-URL-Validierung)
- **Button-Darstellung im Detail-Modal auf älteren Android-Geräten** – "Teilen" und "Schließen" Buttons waren auf altem Android nicht lesbar (elevation-Artefakte)

### Changed
- **Dependency-Updates** – expo 55.0.6, expo-updates 55.0.13, expo-linear-gradient 55.0.8, lint-staged 16.4.0, dotenv 17.3.1 u.a.
- **Security Audit** – 4 Vulnerabilities behoben (2 high, 2 moderate)

## [1.5.1] - 2026-03-14

### Fixed
- **Button-Darstellung auf älteren Android-Geräten** – Weißer Kasten hinter transparenten Buttons behoben (`elevation: 0` für outlined-Variant) und unsichtbarer Text korrigiert (plattformspezifisches `fontWeight`)

## [1.5.0] - 2026-03-11

### Added
- **Animierter Skeleton-Ladebildschirm** – Ersetzt den einfachen Ladeindikator durch einen animierten Shimmer-Effekt (via `expo-linear-gradient`), der die Chart-Struktur vorab andeutet
- **Animierter Theme-Schieberegler** – In den Einstellungen gleitet ein Pill-Indikator beim Wechsel zwischen Hell/Dunkel/System-Theme

### Changed
- **Expo SDK 55** – Upgrade von SDK 54 auf SDK 55
- **Flüssigere Animationen** – Alle UI-Animationen auf `react-native-reanimated` 3.17 umgestellt (vorher: React Native `Animated` API)
- **Einstellungen-Panel** – Öffnet und schließt sich jetzt mit einer Slide-up/down-Animation statt abrupt zu erscheinen
- **Chart-Ansichts-Toggle** – Wechsel zwischen Balken- und Uhransicht erfolgt mit sanftem Übergang
- **Emojis entfernt** – Emoji-Prefixe aus Hinweistexten und Übersetzungen entfernt für konsistenteres Erscheinungsbild
- `newArchEnabled`-Flag aus App-Konfiguration entfernt (in SDK 55 nicht mehr benötigt)

### Fixed
- Hardcoded englischer "Hint:"-Prefix vor Hinweistexten in Charts entfernt – Text war bei deutscher Spracheinstellung nicht lokalisiert (#238)

---

## [1.4.3] - 2026-03-04

### Fixed
- Aktuelle-Stunde-Markierung aus der Geräte-Timeline entfernt – verhindert irreführende Darstellung, als würde eine vergangene Stunde empfohlen (#219)
- Diagramm teilen: `collapsable={false}` für den Capture-Container gesetzt, behebt "Diagramm kann nicht geteilt werden"-Fehler auf Android (#221)

### Changed
- Dark Mode ist jetzt das Standard-Theme für Neuinstallationen (#220)

---

## [1.4.2] - 2026-03-02

### Fixed
- PLZ und Netzentgelte im Personalisieren-Panel nebeneinander (eine Zeile) (#210)
- Redundante Titel aus der "Was kostet das"-Ansicht entfernt (#211)

---

## [1.4.1] - 2026-02-27

### Added
- **Diagramm teilen** – Charts können als PNG-Screenshot geteilt oder heruntergeladen werden (Android: System-Share-Sheet, Web: Download oder Browser-Share) (#163)

### Changed
- Android-Build vollständig lokal via Gradle (kein EAS Cloud Build mehr) (#202)

---

## [1.4.0] - 2026-02-22

### Added
- **Preisdarstellung wählbar** – Nutzer können zwischen Börsenstrompreis und Endkundenstrompreis (inkl. Netzentgelte) umschalten; Einstellung nur für den Hauptchart, Detail-View zeigt immer beide
- **Geräte-Timeline (Appliance Timeline)** – Beste Betriebsstunden für Haushaltsgeräte mit Empfehlung der günstigsten Zeitfenster (#195)
- **Preisalarm** – In-App-Benachrichtigungen und Web-Notifications bei Über-/Unterschreitung von Preisschwellen (Fix #2)
- **24h-Uhransicht** – Alternativer Preis-Chart als 24-Stunden-Uhr (Clock View) mit Toggle (#165)
- **Chart-Animationen** – Karten und Tooltips animieren beim Einblenden (#68)

### Fixed
- Detail-View zeigt immer gestapelten Chart (Börsenstrompreis + Netzentgelte), unabhängig vom gewählten Modus
- Kostenrechner zeigt nur zukünftige Zeitslots (#197)
- Label „Beste Zeit" in „Beste Zeit in der Zukunft" umbenannt
- Zone-Bands und Runner-Bands aus Preis- und Erneuerbare-Charts entfernt
- ClockChart-Labels in SVG verschoben; Preisalarm lädt Schwellen korrekt (value > 0 Validierung)
- Beta-Modus aus „Personalisieren" entfernt
- Metriken immer unter Grafik, View-Toggle im Header (#194)

### Changed
- Preisdarstellungs-Modus gilt nur für den Hauptchart; Detailansicht ist immer gestapelt (`forceStacked`)

---

## [1.3.0] - 2026-01-04

### Added
- **Daily Regional Cache Strategy** - 95% reduction in API calls
  - Persistent cache for regional renewable energy data (localStorage/AsyncStorage)
  - Automatic invalidation after midnight
  - Dual-layer caching (persistent + in-memory) for reliability
  - Only stores current postal code to minimize storage usage

- **Unified Legend System** - Professional chart legends
  - Orange dashed line in RenewableBarChart for regional data visibility
  - Responsive legends (desktop only, hidden on mobile)
  - Consistent styling across all charts
  - New legend section in Settings menu

- **Cloudflare Worker Documentation** - Architecture transparency
  - Comprehensive documentation of CORS proxy solution
  - Architecture diagrams and deployment details
  - Security and privacy guarantees documented

### Fixed
- **iOS/PWA Postal Code Persistence** - Users no longer need to re-enter postal code
  - Fixed AsyncStorage initialization issues with static imports
  - Postal code now persists across app restarts
  - Proper error handling with graceful fallbacks

- **Android Regional Data Display** - Regional data now loads on native apps
  - Fixed AsyncStorage integration for Android platform
  - Regional renewable data visible alongside national data
  - Consistent regional cache behavior across platforms

- **Settings Menu Spacing** - Uniform visual hierarchy
  - Removed inconsistent padding in REGION and LEGEND sections
  - All menu sections now use consistent spacing (paddingHorizontal: 16, paddingVertical: 12)
  - Professional, polished appearance across all platforms

- **Service Worker Cache-Busting** - Proper version updates
  - Removed hardcoded cache versions preventing app updates
  - Dynamic cache-busting mechanism now works correctly
  - Users receive latest app version without manual cache clearing

- **Deploy Workflow File Handling** - All build artifacts deployed
  - Fixed `git add -A .nojekyll` syntax error in deploy workflow
  - All new files (JS bundles, manifests) now properly staged and deployed
  - Ensure fetch-depth: 0 prevents cache issues with Git history

### Changed
- Version bumped from 1.2.4 to 1.3.0
- Android versionCode increased from 9 to 10
- Improved regional data initialization timing
- Storage adapter refactored for better platform compatibility

### Technical
- Refactored platform-specific storage handling
- Improved AsyncStorage initialization on mobile
- Enhanced error logging for storage operations
- Build and deployment pipeline improvements

---

## [1.2.3] - 2025-12-26

### Fixed
- **Price Chart Legend Responsiveness** - Legend now hides on phone, shows on tablet/desktop
  - Improved visual hierarchy and space usage across different screen sizes
  - Better user experience on mobile devices

- **Tooltip Text Contrast** - Enhanced readability of price information
  - Fixed tooltip text contrast issues in price chart
  - Users can now clearly read price values on all backgrounds

### Changed
- **Theme-Aware Chart Colors** - Consistent color system across all charts
  - Applied centralized theme colors to all chart components
  - PriceBarChart, RenewableBarChart, and CorrelationScatterChart now use unified color palette
  - Improved visual consistency across the application
  - Better dark/light mode support

### Technical
- Version bumped from 1.2.2 to 1.2.3
- Android versionCode increased from 7 to 8
- Build ready for Google Play Store distribution

---

## [Unreleased (Next Release)]

### Fixed
- **Issue #98: Immediate Loading Indicator** - Visual feedback before React hydration
  - Added CSS spinner in HTML that appears immediately on page load
  - MutationObserver detects React rendering and fades out the loading screen
  - Fallback timeout (5s) hides loading even if React fails
  - Users see instant visual feedback instead of blank screen

- **Issue #100: Landscape Mode Chart Responsiveness** - Dynamic chart sizing
  - Added Dimensions.addEventListener to react to orientation changes
  - Charts now properly adapt to landscape vs portrait orientation
  - Landscape mode: charts fill 90% of available height for better usability
  - Portrait mode: 3 charts fit optimally without excessive scrolling

- **Issue #101: Modern Design System** - Consistent, professional UI
  - Created designSystem.ts with comprehensive design tokens
  - 8px grid system for spacing (4px to 48px scale)
  - Modern color palette with semantic colors and proper contrast
  - Unified theme system supporting light/dark modes
  - Updated style.css with CSS variables and utility classes
  - All components now use consistent, accessible colors

- **Metrics Display Contrast** - Fixed unreadable metrics values
  - Light mode: surfaceSecondary changed from #EFEFEF to #E5E5E5 (darker background)
  - Text labels now use colors.text (#1A1A1A) instead of textSecondary for better contrast
  - Metric values use colors.primary (#2563EB in light, #60A5FA in dark) for vibrant, readable display
  - WCAG AA contrast compliance for accessibility

- **Issue #105: Missing Details Button on Android** - Fixed invisible button
  - Increased Details button z-index from 10 to 100
  - Resolves z-index conflict with chart touch areas
  - Button now clickable on all platforms (web, Android, iOS)

### Added
- **Issue #104: Legend Section in Settings Menu** - Educational price breakdown
  - New LEGEND section in settings explaining end-customer price calculation
  - Shows visual elements matching chart colors (green market price, gray grid fees)
  - Dynamic display using centralized GRID_FEES_AND_TAXES constant (20 ¢/kWh)
  - Visible on all platforms (mobile, tablet, desktop)
  - Translations: English and German with localized descriptions

- **Issue #106: Dual Price Display in Metrics** - Complete price transparency
  - Metrics modal now shows both prices when viewing price chart details:
    - **End-customer price** (top, primary) - what consumers actually pay
    - **Market price** (bottom, secondary) - wholesale electricity price
    - Visual separation with divider and informative note
  - Enhanced tooltip on bar hover showing price breakdown:
    - Börsenpreis (market price)
    - + Netzentgelte (grid fees: 20 ¢/kWh)
    - = Endkunde (total customer price)
  - Price legend now visible on all platforms
    - Desktop: horizontal layout
    - Mobile: vertical layout with full descriptions

- **Enhanced Price Chart Legend** - Improved visibility and information
  - Legend elements now visible on mobile (was desktop-only before)
  - Shows all components with color-coded boxes:
    - Green box: Market Price (Börsenstrompreis)
    - Gray box: Grid Fees & Taxes (20 ¢/kWh)
    - Faded green: Interpolated data indicator
  - Grid fees amount displayed inline: "(20 ¢/kWh)"

- **Centralized Grid Fees Constant** - Single source of truth for markup
  - All price references now use `GRID_FEES_AND_TAXES` from `utils/metrics.ts`
  - Eliminates hardcoded "20" values throughout codebase
  - Easy to update: change constant in one place affects entire app
  - Applied to: Settings legend, metrics display, price tooltips, chart legend
  - Currently set to 20 ¢/kWh (represents grid fees and taxes)

### Added
- **48h Renewable Forecast Utilization** - Game-changing improvement to data coverage
  - Energy Charts renewable forecast extends 48h (not just 24h like prices!)
  - Modified workflow to preserve ALL renewable timestamps (union of price+renewable)
  - Enrich renewable-only points with aWATTar prices
  - Result: Tomorrow's data now shows BOTH renewable share AND prices
  - No more grey bars for tomorrow - full green renewable bars!
  - Data Merge Strategy v3.1

- **Daily History Files** - Optimized storage for app historical data feature
  - Daily JSON files (~15KB each) at `public/data/history/YYYY-MM-DD.json`
  - Contains 96 data points (24h @ 15min intervals)
  - Automatic 90-day retention with cleanup
  - Only saves complete days (92+ of 96 points)
  - Storage: ~1.4MB for 90 days (vs ~27MB for archives)
  - Enables granular loading: load only needed days
  - No decompression needed, predictable naming

- **Automatic Archive Cleanup** - Bounded storage growth
  - 90-day retention for both archives and history files
  - Automatic cleanup during each data update
  - Total storage: ~28MB (28% of 100MB budget)

### Fixed
- **Workflow Repository Rule Bypass** - Fixed workflow push failures
  - Problem: GitHub repository rules prevented direct pushes to main
  - Error: "push declined due to repository rule violations"
  - Solution: Use PAT_TOKEN (with fallback to GITHUB_TOKEN) to bypass rules
  - Result: Automated data updates can now push directly to main

- **Auto-Deploy After Data Updates** - Simplified deployment trigger
  - Removed redundant manual workflow dispatch (caused 403 errors)
  - Push to main automatically triggers deploy.yml workflow
  - Result: Website auto-updates after every data commit
  - No manual intervention needed!

- **Missing Tomorrow's Renewable Data** - Solved the grey bar problem! 🎉
  - Previously: Energy Charts 48h renewable forecast was DISCARDED (only used 24h with prices)
  - Now: Preserve ALL 192 renewable forecast points (not just 96 with prices)
  - Enrich renewable-only points (tomorrow) with aWATTar prices
  - Result: Full renewable share data for 48h (no more grey bars for tomorrow!)
  - This was the root cause of user's "neuesten Daten werden nicht angezeigt" issue
  - Data Merge Strategy upgraded from v3.0 to v3.1

- **Renewable Interpolation Flag** - Corrected incorrect flag behavior
  - `isRenewableShareInterpolated` now always false
  - Renewable data is never interpolated (only market price is)
  - Prevents incorrect interpolation markers on renewable chart

- **24h Past Data Filter** - Improved chart focus
  - Data stored for 7 days (history preservation)
  - Display: only 24h past + all future data
  - Reduces chart clutter, focuses on relevant timeframe
  - Metrics calculations use filtered data

- **Chart Layout Consistency** - Unified chart structure and positioning across all components
  - Y-axis labels now positioned consistently at 40% from top (horizontalOffset: -15)
  - Fixed right-side overflow in narrow browser windows (all X-calculations now use rightPadding)
  - Unified container heights across all three charts (removed inconsistent bottomPadding additions)
  - All chart elements (bars, touch areas, lines, labels) now respect rightPadding boundaries
  - Consistent layout structure: Y-labels inside chart container (not outside)

- **Dark Mode UI: White block under last chart** - Fixed mobile display issue
  - Added paddingBottom to ScrollView contentContainerStyle
  - Added wrapper View with dynamic background color in SafeAreaProvider
  - Ensures proper theme background on all screen sizes and devices
  - No more white blocks appearing below content in Dark Mode

### Changed
- **Data Merge Strategy v3.1** - Smart 48h renewable forecast utilization
  - Preserve ALL Energy Charts renewable timestamps (union of price+renewable)
  - Enrich renewable-only data points with aWATTar prices
  - Result: 48h complete data (price + renewable for today AND tomorrow)
  - Supersedes v3.0 which had grey bars for tomorrow

- **Data Merge Strategy v3.0** - Simplified, robust approach (SUPERSEDED by v3.1)
  - Removed complex renewable enrichment (unreliable EC API)
  - 2x daily updates: 12:00 + 15:00 UTC (Day-Ahead timing)
  - Simple compare logic: only checks max timestamp
  - Grey fading bars for missing renewable data
  - Stable, predictable, transparent pipeline

### Technical
- Modified Energy Charts workflow processing to preserve 48h renewable forecast
- Updated merge-market-data.js to enrich renewable-only points with aWATTar prices
- Workflow now uses PAT_TOKEN to bypass repository protection rules
- Removed redundant workflow dispatch step (deploy.yml auto-triggers on push)
- Storage structure optimized for app historical data
- Archive cleanup integrated into GitHub Actions workflow
- Frontend 24h filter with useMemo optimization
- Documentation updated in DATA-MERGE-STRATEGY.md

### Planned
- Phase 5: Testing & Polish
  - Unit tests for core data merging logic
  - E2E tests for workflows
  - Performance optimization

---

## [1.1.0] - 2025-11-03

### Added
- **Complete Bilingual Support** - German/English localization throughout the app
  - Automatic browser language detection
  - Manual language toggle in settings
  - All UI elements, chart labels, and tooltips translated
  - Persistent language preference in localStorage
  - Date/time formatting adapts to selected language

- **Interactive Chart Enhancements**
  - Hover tooltips on all three charts (desktop/web)
  - Touch tooltips for mobile devices
  - Date/time display on correlation scatter chart
  - Value display on bar charts
  - 24px touch areas for better mobile UX
  - Smooth hover transitions with visual feedback

### Changed
- **Improved Chart Consistency**
  - Unified Y-axis label positioning across all charts
  - Consistent padding values (40px) for uniform spacing
  - Gray highlights (#999999) for more subtle selection feedback
  - Optimized chart rendering for better performance

### Fixed
- localStorage access issues causing 404 errors on page reload
- Hover functionality now works consistently across all charts
- Y-axis label spacing now uniform across all three charts
- SSR-safe browser API access with proper error handling

### Technical
- Enhanced chart components with localization props
- Improved event handling with z-index layering
- Platform-specific touch/hover handlers for cross-platform support
- Centralized translation management in App.tsx

---

## [1.0.3] - 2025-10-18

### Fixed
- **GitHub Actions Integration** - Deploy workflow now triggers reliably on data updates
  - Integrated deploy job directly into fetch.yml workflow
  - Removed problematic `workflow_call` pattern that prevented auto-triggering
  - Added proper permission configuration for deployments
  - Workflow chain: fetch → update → build → deploy now works seamlessly

### Changed
- Refactored GitHub Actions workflows for better reliability
- Streamlined workflow triggering mechanism

---

## [1.0.2] - 2025-10-14

### Fixed
- **GitHub Pages 404 Error** - _expo directory no longer accessible
  - Added `.nojekyll` file to prevent Jekyll processing
  - Updated build scripts to include `.nojekyll` in distribution
  - App now loads correctly on GitHub Pages

### Added
- Local development build variant (`npm run build:local`)
- Local development server setup (`npm run serve:local`)

### Changed
- Improved build configuration with post-build scripts

---

## [1.0.1] - 2025-10-12

### Added
- **Hybrid Data Strategy** - Enhanced forecast coverage from 24h to 43+ hours
  - Energy Charts (Fraunhofer ISE) as primary source
  - aWATTar (EPEX Spot Market) as supplement & fallback
  - Intelligent merging: supplements only when gap ≥3 hours
  - Result: Up to 43+ hours of forecast data with high-quality renewable share info

- New documentation
  - `DATA-MERGE-STRATEGY.md` - Detailed merge algorithm documentation
  - Enhanced README with data source explanation

### Changed
- Updated data fetching workflow to implement merge strategy
- Improved GitHub Actions workflow configuration
- Better data coverage and reliability

### Technical Details
- Energy Charts: Primary source with renewable share forecast
- aWATTar: Extends coverage when gap detected
- Source attribution: Maintained throughout merge process

---

## [1.0.0] - 2025-10-07

### Added
- Initial project release
- React Native/Expo-based energy price visualization app
- Real-time data visualization of electricity market prices
- Renewable energy share correlation analysis
- Web, iOS, and Android support
- Dark/Light theme with system detection
- Data export functionality (CSV/JSON)

### Features
- Interactive charts for price trends
- Renewable energy share correlation
- Responsive design across platforms
- Automatic system theme detection with manual override
- Cross-platform support (Web, iOS, Android)

### Infrastructure
- GitHub Actions automation for data updates
- GitHub Pages deployment
- Automated market data fetching from aWATTar API
- Service worker for offline support
- Expo/React Native framework

---

## Project Phases

### Phase 1: Project Foundation (Initial Setup)
- Project structure and dependencies
- Initial API integration (aWATTar)
- Basic visualization and theming

### Phase 2: Data Enhancement (Oct 12-14)
- Hybrid data strategy implementation
- Energy Charts integration
- GitHub Pages fixes (.nojekyll)
- Improved build configuration

### Phase 3: Offline Support (Oct 14-17)
- Offline-first architecture
- Service worker optimization
- Sync queue implementation
- Offline persistence

### Phase 4: Workflow Improvements (Oct 18)
- GitHub Actions reliability fixes
- Direct deploy job integration
- Workflow optimization

### Phase 5: Testing & Polish (Planned)
- Comprehensive test suite
- Performance optimization
- UI/UX refinements

---

## Data Sources

- **Energy Charts API** (Fraunhofer ISE): Day-ahead market prices and renewable energy forecasts
- **aWATTar API** (EPEX Spot Market): Extended price forecasts and supplementary data
- **Mock Data**: Fallback demonstration data when both APIs unavailable

---

## Repository Structure

- `/js` - JavaScript modules (UI, storage, offline-queue, drag management)
- `/scripts` - Build and data processing scripts
- `/.github/workflows` - GitHub Actions automation
- `/public` - Static assets and service worker
- `style.css` - Application styling

---

## Technologies

- **React Native** - Cross-platform mobile development
- **Expo** - Universal React application framework
- **Victory Native** - Charting library
- **TypeScript** - Type-safe development
- **Service Workers** - Offline functionality
- **GitHub Actions** - CI/CD automation

---

## Versioning

This project follows Semantic Versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes or major feature releases
- MINOR: New features, backward compatible
- PATCH: Bug fixes and improvements

Current version: **1.1.0**

---

## License

MIT License - See LICENSE file for details

---

## Contact

- GitHub: [Energy Price Germany](https://github.com/S540d/Energy_Price_Germany)
- Web: [Live Demo](https://s540d.github.io/Energy_Price_Germany/)
- Author: S540d
