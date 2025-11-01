# Design Guidelines - Support Links & Store Compliance

**Projekt-übergreifende Designvorgaben für alle S540d Apps**

## 📋 Hintergrund

Um vollständige Compliance mit App Store Richtlinien zu gewährleisten und eine konsistente User Experience über alle Projekte hinweg zu schaffen, gelten folgende Richtlinien:

## 🎯 Support-Link Platzierung

### ❌ NICHT erlaubt

**Footer-Button mit direktem Support-Link:**
```tsx
// FALSCH - zu prominent, könnte als Werbung interpretiert werden
<TouchableOpacity onPress={() => window.open('https://buymeacoffee.com/...')}>
  <Text>Support me</Text>
</TouchableOpacity>
```

**Warum nicht?**
- Google/Apple könnten dies als "In-App-Werbung" interpretieren
- Zu prominent platziert (immer sichtbar im Footer)
- Begriff "Support me" wirkt wie Monetarisierung
- Bei Play Store Submission könnte "Contains Ads" fälschlicherweise angekreuzt werden müssen

### ✅ EMPFOHLEN

**Settings/About-Menü Integration:**
```tsx
// RICHTIG - in Settings-Menü integriert
<TouchableOpacity onPress={() => setMenuVisible(true)}>
  <Text>⚙️ Settings</Text>
</TouchableOpacity>

// Im Settings-Menü:
<TouchableOpacity onPress={() => openExternalLink('https://buymeacoffee.com/...')}>
  <Text>💝 Support the Project</Text>
</TouchableOpacity>
```

**Warum besser?**
- Nicht als Werbung interpretierbar
- Professional und Standard-konform
- Vergleichbar mit GitHub Sponsors, Patreon in Open Source Apps
- Explizit freiwillig, nicht aufdringlich
- In separatem Kontext (About/Settings)

---

## 🎨 Standardisierte Implementierung

### Footer-Design

**Empfohlene Footer-Buttons:**
```tsx
<View style={styles.footer}>
  {/* Theme Toggle */}
  <TouchableOpacity onPress={toggleTheme}>
    <Text>🌓</Text>
  </TouchableOpacity>

  {/* Settings/Menu */}
  <TouchableOpacity onPress={() => setMenuVisible(true)}>
    <Text>⚙️</Text>
  </TouchableOpacity>
</View>
```

**Elemente, die im Footer bleiben können:**
- Theme Toggle (Hell/Dunkel)
- Settings/Menu Button
- Export-Funktionen
- App-spezifische Aktionen (z.B. "Neue Aufgabe", "Filter")

**Elemente, die NICHT in den Footer gehören:**
- ❌ Direkte Support-Links
- ❌ Social Media Links
- ❌ Externe Werbung
- ❌ Store-Ratings-Aufforderungen im Footer

---

### Settings/About-Menü Design

**Standardstruktur:**

```
⚙️ Settings / About

📊 App Settings
  ├─ 🌓 Theme (Light/Dark/Auto)
  ├─ 📱 Language
  └─ 🔔 Notifications (falls relevant)

ℹ️ About
  ├─ 📱 Version X.Y.Z
  ├─ 📜 Privacy Policy
  ├─ 📄 Open Source License (MIT)
  └─ 🔗 GitHub Repository

💝 Support
  ├─ 💝 Support the Project (Buy Me a Coffee)
  ├─ ⭐ Rate on [Play Store/App Store]
  └─ 🐛 Report a Bug (GitHub Issues)
```

**Text-Formulierung:**
- ✅ "Support the Project"
- ✅ "Support Development"
- ✅ "Buy Me a Coffee ☕"
- ❌ NICHT: "Support me" (zu persönlich)
- ❌ NICHT: "Donate" (klingt wie Charity)
- ❌ NICHT: "Premium" (klingt wie IAP)

---

## 🏪 Store Compliance

### Google Play Store

**"Contains Ads" Angabe:**
```
❌ NO - App enthält keine Werbung
```

**Data Safety Section:**
```
Ad SDK Usage: None
Third-party advertising: No
Personal data collected for advertising: No
```

**Begründung:**
- Support-Link im Settings-Menü = KEINE Werbung
- Keine Ad-SDKs (AdMob, Facebook Ads, etc.)
- Keine Tracking-Cookies für Monetarisierung
- Freiwillige Unterstützung ≠ Werbung

### Apple App Store

**"Contains Ads" Angabe:**
```
❌ NO - App enthält keine Werbung
```

**App Privacy:**
```
Data Not Collected
Third-Party Analytics: None
```

---

## 📱 Plattform-spezifische Implementierung

### Web (React Native Web)

```tsx
const openExternalLink = (url: string) => {
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url);
  }
};
```

### Android / iOS

```tsx
import { Linking, Platform } from 'react-native';

const openExternalLink = async (url: string) => {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    console.error(`Cannot open URL: ${url}`);
  }
};
```

---

## 🎯 Anwendungsbereiche

Diese Richtlinien gelten für alle folgenden Projekte:

- ✅ **Energy Price Germany**
- ✅ **1x1_matrix**
- ✅ **Eisenhauer** (Eisenhower Matrix)
- ✅ **Pflanzkalender**
- ✅ **CD_to_Spotify**
- ✅ Alle zukünftigen Projekte

---

## 🔄 Migration Checklist

Bei bestehenden Apps:

- [ ] Support-Link aus Footer entfernen
- [ ] Settings/About-Menü erstellen (falls nicht vorhanden)
- [ ] Support-Link unter "Support the Project" in Settings einfügen
- [ ] Text von "Support me" zu "Support the Project" ändern
- [ ] Testen auf allen Plattformen (Web, Android, iOS)
- [ ] Store Listings überprüfen ("Contains Ads" = NO)
- [ ] Commit mit Hinweis auf Store Compliance

---

## 📚 Referenzen

- [Google Play Policy: Ads](https://support.google.com/googleplay/android-developer/answer/9857753)
- [Apple App Store: Advertising Guidelines](https://developer.apple.com/app-store/review/guidelines/#advertising)
- [IARC Content Ratings](https://www.globalratings.com/)

---

## 📝 Version History

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2025-11-01 | Initial Guidelines - Support Link Platzierung |

---

**Fragen oder Anpassungen?**
GitHub Issues: https://github.com/S540d/[projekt-name]/issues
