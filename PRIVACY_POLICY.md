# Privacy Policy / Datenschutzerklärung – Energy Price Germany

> The authoritative, published version is [`public/PRIVACY_POLICY.html`](public/PRIVACY_POLICY.html)
> (https://s540d.github.io/Energy_Price_Germany/PRIVACY_POLICY.html, linked in the app and on Google Play).
> This file mirrors its content. Keep both in sync.

**Last updated: October 25, 2026** (applies from app version 1.11.5)

## Summary

No account. No tracking. No ads. No analytics. The app itself does not collect personal data. As with any request over the internet, the servers contacted technically receive your IP address (see "Network connections").

## Controller

See the [Legal Notice (Impressum)](https://s540d.github.io/impressum.html). Contact: [GitHub Issues](https://github.com/S540d/Energy_Price_Germany/issues).

## Data stored locally

Stored **only on your device** (Android: app storage, web: browser storage), never transmitted to us:

- Settings: language, appearance, country, grid fee display
- Postal code, if you enter one for regional data
- Price alert thresholds, if set
- Cached data: prices, renewable share, history, regional values

Delete it by uninstalling the app, clearing app storage, or clearing site data in the browser.

## Network connections

Your **IP address** is transmitted to each server contacted; logging is governed by the provider's own policy.

| Service | When | Data beyond the IP address |
|---|---|---|
| **GitHub Pages** (`s540d.github.io`) | Web version and every data request (also Android) | none. Prices/renewables are prepared by GitHub Actions from Energy Charts and aWATTar; the app does not contact those for this data. |
| **Energy Charts** (Fraunhofer ISE, `api.energy-charts.info`) | With your postal code; without one only if nationwide values for today are missing (fixed substitute postal code Berlin 10115). Android contacts it directly | the postal code used |
| **Cloudflare** (`energypricegermany.sven4321.workers.dev`) | Web version only, same requests as Energy Charts (browsers cannot query the Energy Charts interface directly) | postal code; response cached up to 1 h per postal code, without IP reference |

Without your own postal code, no information about your location is transmitted.

## Permissions (Android)

- `INTERNET`: retrieve the data above
- `ACCESS_NETWORK_STATE`: check connectivity

Web: browser notification permission is requested only when a price alert is used; notifications are created locally while the page is open, no push service.

## No tracking

No analytics, no ads or ad trackers, no crash reporting, no cookies, no user account.

## External links

Links (GitHub, Google Play, Ko-fi) open in the browser; the providers' privacy policies apply.

## Your rights

We hold no personal data about you. Local data can be deleted by you at any time. Questions: see "Controller".

---

## Datenschutzerklärung (Kurzfassung)

**Zuletzt aktualisiert: 25. Oktober 2026** (gilt ab App-Version 1.11.5). Maßgeblich ist die veröffentlichte Fassung in [`public/PRIVACY_POLICY.html`](public/PRIVACY_POLICY.html).

- **Kein Konto, kein Tracking, keine Werbung, keine Analyse-Tools.** Die App erhebt selbst keine personenbezogenen Daten.
- **Verantwortlicher:** siehe [Impressum](https://s540d.github.io/impressum.html), Kontakt über [GitHub Issues](https://github.com/S540d/Energy_Price_Germany/issues).
- **Lokal gespeichert** (nur auf dem Gerät): Einstellungen, ggf. Postleitzahl, Preisalarm-Schwellen, zwischengespeicherte Daten. Löschbar durch Deinstallation, Leeren des App-Speichers oder der Website-Daten.
- **Netzwerkverbindungen** (dabei wird jeweils technisch die IP-Adresse übermittelt):
  - **GitHub Pages** (`s540d.github.io`): Web-Version und alle Datenabrufe, auch in der Android-App.
  - **Energy Charts** (Fraunhofer ISE): mit Ihrer Postleitzahl (wird übermittelt); ohne eigene Postleitzahl nur, wenn bundesweite Werte für heute fehlen, dann mit der festen Ersatz-PLZ Berlin (10115). Die Android-App fragt direkt an.
  - **Cloudflare**: nur in der Web-Version, für dieselben Anfragen (Weiterleitung, da Browser die Schnittstelle nicht direkt abfragen können); erhält Postleitzahl und IP-Adresse, Zwischenspeicherung bis 1 h je Postleitzahl ohne IP-Bezug.
  - Ohne eigene Postleitzahl werden keine Angaben zu Ihrem Standort übermittelt.
- **Berechtigungen (Android):** `INTERNET`, `ACCESS_NETWORK_STATE`. Web: Benachrichtigungen nur bei Preisalarm, lokal im Browser, kein Push-Dienst.
- **Externe Links** (GitHub, Google Play, Ko-fi): Es gelten die Bestimmungen der Anbieter.
