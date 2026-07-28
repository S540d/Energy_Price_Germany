# Energy Price Germany

Real-time visualization of electricity market prices (day-ahead / EPEX Spot) and renewable energy
share in Germany — free, ad-free and without tracking.

*Aktuelle Börsenstrompreise und Ökostrom-Anteil in Deutschland: Day-Ahead-Preise, erneuerbare
Energien im Netz, regionale Daten per Postleitzahl und Verlaufsstatistiken — kostenlos, werbefrei
und ohne Tracking. Nützlich mit dynamischem Stromtarif, Wallbox, Wärmepumpe, PV-Anlage oder
Batteriespeicher.*

## Get the app

| Platform | Link |
| -------- | ---- |
| Android  | [Google Play](https://play.google.com/store/apps/details?id=com.sven4321.energypricegermany) |
| Web / PWA | [s540d.github.io/Energy_Price_Germany](https://s540d.github.io/Energy_Price_Germany/) |

The web version is installable as a PWA; on Android the Play Store build is recommended.

## Tech Stack

| Technology                | Role                             |
| ------------------------- | -------------------------------- |
| React Native + Expo 55    | Cross-platform framework         |
| TypeScript                | Type-safe JavaScript             |
| React Native SVG          | Custom chart rendering           |
| React Native Reanimated   | Animations and transitions       |
| Cloudflare Workers        | CORS proxy for regional API      |
| GitHub Pages              | Web deployment                   |

## Features

- **Day-ahead prices** — current electricity market prices (EUR/MWh), up to 43h forecast
- **Renewable energy share** — percentage of renewables in the German grid
- **Regional data** — optional postal code-based local grid renewable share (Energy Charts Signal API)
- **Interactive charts** — price trends and renewable share over time with hover/touch
- **Correlation analysis** — relationship between prices and renewable availability
- **Data export** — CSV or JSON export for further analysis
- **Dark/Light theme** — automatic system detection with manual override
- **Offline-capable** — PWA, previously loaded data cached
- **Bilingual** — German and English with automatic language detection
- **More countries (BETA)** — Netherlands, Austria, Switzerland, France, Belgium, Denmark

## Data Sources

1. **Energy Charts (Fraunhofer ISE)** — primary source, 15-min resolution, ~24h coverage
2. **aWATTar (EPEX Spot Market)** — supplement and fallback, ~48h coverage
3. **Energy Charts Signal API** — regional data by postal code (via Cloudflare Worker)

## License

MIT License — see [LICENSE](LICENSE).
