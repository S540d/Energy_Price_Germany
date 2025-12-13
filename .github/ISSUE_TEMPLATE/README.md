# Issue Templates - Anleitung

Dieses Projekt verwendet strukturierte Issue-Templates, um Rückmeldungen systematisch zu erfassen und daraus konkrete Maßnahmen abzuleiten.

## Verfügbare Templates

### 1. 🐛 Bug Report (`bug_report.md`)
Für die Meldung von Fehlern und Bugs.

**Wann verwenden:**
- Die App stürzt ab oder funktioniert nicht wie erwartet
- Fehler in der Darstellung oder Funktionalität
- Plattformspezifische Probleme

**Wichtige Abschnitte:**
- **Schritte zur Reproduktion**: Klare Anleitung zum Nachstellen des Fehlers
- **Umgebung**: Plattform, Browser/OS, Gerätetyp
- **Priorität & Häufigkeit**: Hilft bei der Priorisierung

### 2. 💡 Feature Request (`feature_request.md`)
Für neue Funktionen und Verbesserungsvorschläge.

**Wann verwenden:**
- Vorschlag für neue Features
- Verbesserungen bestehender Funktionalität
- UI/UX Optimierungen

**Wichtige Abschnitte:**
- **Use Cases**: Konkrete Anwendungsszenarien
- **Gewünschte Lösung**: Detaillierte Beschreibung der Implementierung
- **Priorität**: Must-have, Should-have, Nice-to-have

### 3. 🧪 Testing Feedback (`testing_feedback.md`)
Für strukturierte Rückmeldungen aus Tests (Issue #74 Kontext).

**Wann verwenden:**
- Ergebnisse aus manuellen oder automatisierten Tests
- QA-Feedback
- Acceptance Testing Ergebnisse
- Regression Testing Befunde

**Wichtige Abschnitte:**
- **Gefundene Probleme**: Mit Schweregrad und Reproduktionsschritten
- **Empfohlene Maßnahmen**: Konkrete, priorisierte Handlungsempfehlungen
- **Akzeptanzkriterien**: Wann gelten Probleme als behoben
- **Test-Coverage**: Welche Szenarien wurden abgedeckt

## Workflow: Von Testing Feedback zu konkreten Maßnahmen

Das Testing Feedback Template ist speziell darauf ausgelegt, aus Testergebnissen konkrete Maßnahmen abzuleiten:

### 1. Testing durchführen
- Verwende das Testing Feedback Template
- Dokumentiere alle Befunde strukturiert
- Priorisiere nach Schweregrad

### 2. Maßnahmen definieren
Im Abschnitt "Empfohlene Maßnahmen" werden konkrete Tasks mit Prioritäten erstellt:
- **Priorität 1 (Sofort)**: Blocker und kritische Bugs
- **Priorität 2 (Nächster Sprint)**: Wichtige Verbesserungen
- **Priorität 3 (Backlog)**: Nice-to-have Optimierungen

### 3. Issues erstellen
Aus dem Testing Feedback können separate Issues erstellt werden:
- Für jeden kritischen Bug → Bug Report Issue
- Für Feature-Verbesserungen → Feature Request Issue
- Referenziere das ursprüngliche Testing Feedback Issue

### 4. Akzeptanzkriterien tracken
Die definierten Akzeptanzkriterien dienen als Definition of Done:
- ✅ Kriterium erfüllt
- ⏳ In Arbeit
- ❌ Noch offen

## Best Practices

### Für Bug Reports
1. **Reproduzierbarkeit ist key**: Je klarer die Schritte, desto schneller die Lösung
2. **Screenshots helfen**: Ein Bild sagt mehr als tausend Worte
3. **Umgebung angeben**: Viele Bugs sind plattformspezifisch
4. **Priorität realistisch einschätzen**: Hilft beim Triaging

### Für Feature Requests
1. **Problem zuerst**: Erkläre das "Warum" vor dem "Wie"
2. **Use Cases liefern**: Konkrete Anwendungsszenarien machen den Bedarf klar
3. **Alternativen überlegen**: Zeigt, dass du über verschiedene Lösungen nachgedacht hast

### Für Testing Feedback
1. **Strukturiert bleiben**: Nutze die vorgegebenen Abschnitte
2. **Konkrete Maßnahmen**: Statt "Button funktioniert nicht" → "Submit-Button sendet keine Daten beim Klick - Fix: Event Handler Validierung"
3. **Priorisierung**: Hilft dem Team bei der Sprint-Planung
4. **Test-Coverage dokumentieren**: Zeigt, was bereits getestet wurde
5. **Regression-Risiko einschätzen**: Warnt vor potentiellen Seiteneffekten

## Beispiel-Workflow: Issue #74

**Ausgangssituation:**
> "Im Testen die Rückmeldung im Issue #74 bekommen"

**Mit neuem Template:**

1. **Testing Feedback Issue erstellen**
   - Test-Typ: Manueller Test
   - Gefundene Probleme dokumentieren
   - Schweregrad einstufen
   - Empfohlene Maßnahmen mit Prioritäten definieren

2. **Maßnahmen ableiten**
   - Priorität 1: Sofortige Fixes (z.B. kritische Bugs)
   - Priorität 2: Verbesserungen für nächsten Sprint
   - Priorität 3: Backlog Items

3. **Separate Issues für Umsetzung**
   - Jede Maßnahme wird zum eigenen Issue/Task
   - Referenz zum Testing Feedback Issue
   - Klare Akzeptanzkriterien

4. **Tracking & Follow-up**
   - Akzeptanzkriterien als Checkliste
   - Follow-up Tests nach Implementierung

## Template-Struktur

Alle Templates folgen diesem Aufbau:

```yaml
---
name: Template Name
about: Beschreibung des Template-Zwecks
title: '[PREFIX] '
labels: label1, label2
assignees: ''
---
```

Die YAML-Frontmatter definiert:
- **name**: Name des Templates in GitHub UI
- **about**: Beschreibung, wann es verwendet werden soll
- **title**: Standard-Präfix für den Issue-Titel
- **labels**: Automatisch zugewiesene Labels

## Konfiguration

Die `config.yml` bietet zusätzliche Links:
- 📖 Dokumentation
- 💬 GitHub Discussions für Fragen
- 🌐 Live Demo zum Testen

## Weitere Informationen

- [GitHub Issue Templates Dokumentation](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)
- [Pull Request Template](../PULL_REQUEST_TEMPLATE.md) des Projekts
- [CHANGELOG.md](../../CHANGELOG.md) für Release-Informationen
