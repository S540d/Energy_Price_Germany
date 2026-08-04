# Lokaler Cache-Cleanup

Führe den lokalen Cache-Cleanup für alle Projekte aus (Festplattenplatz freigeben).

Dies ist ein manueller, seltener Eingriff (kein automatischer Cron) — nur auf
explizite Anfrage ausführen.

## 1. Report erzeugen (Dry-Run)

Führe im project-templates-Verzeichnis aus:

```bash
cd "$(find ~/Documents -maxdepth 4 -type d -name project-templates 2>/dev/null | head -1)"
./scripts/clean-local-cache.sh --dry-run
```

Zeige das Ergebnis (Größen pro Projekt, geplante Löschungen) als Übersicht.

## 2. Rückfrage

Frage explizit: "Sollen diese Caches gelöscht werden? (node_modules, dist,
build, .expo, android/.gradle, android/app/build)"

Bei Zustimmung:

```bash
./scripts/clean-local-cache.sh --yes
```

## 3. Optional: globale Caches

Frage separat: "Auch globale Caches leeren? (~/.gradle/caches ~9GB, ~/.npm
~900MB — betrifft alle Gradle-/Node-Projekte gemeinsam)"

Bei Zustimmung:

```bash
./scripts/clean-local-cache.sh --yes --global
```

## 4. Hinweis nach dem Löschen

Erinnere daran, dass beim nächsten Start des jeweiligen Projekts
`npm install` (und ggf. `npx expo prebuild` / Gradle-Sync) nötig ist.
