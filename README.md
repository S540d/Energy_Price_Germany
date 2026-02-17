# Energy Price Germany

A React Native/Expo app for visualizing energy prices and renewable energy share in Germany. This project provides real-time data visualization of electricity market prices and the percentage of renewable energy in the grid.

## Features

- **Real-time Data**: Fetches current energy market data from reliable sources
- **Regional Data**: Optional postal code-based regional renewable energy data
- **Interactive Charts**: Visualize price trends and renewable energy share over time with hover/touch interactions
- **Correlation Analysis**: See the relationship between energy prices and renewable energy availability
- **Bilingual Support**: Full German/English localization with automatic language detection
- **Responsive Design**: Works on web, iOS, and Android with optimized layouts
- **Dark/Light Theme**: Automatic system theme detection with manual override
- **Progressive Web App (PWA)**: Install on mobile devices, works offline
- **Data Export**: Export data as CSV or JSON for further analysis

## Data Sources

The app uses a **hybrid data strategy** for maximum forecast coverage:

1. **Energy Charts (Fraunhofer ISE)** - Primary source (15-min resolution, ~24h coverage)
   - Day-ahead market prices (EUR/MWh)
   - Renewable energy share forecast (%)
   
2. **aWATTar (EPEX Spot Market Data)** - Supplement & Fallback (~48h coverage)
   - Supplements Energy Charts when coverage gap ≥3h
   - Interpolated to 15-minute intervals
   - Used as fallback when Energy Charts unavailable

3. **Energy Charts Signal API** - Regional data (optional, user-configured)
   - Regional renewable energy share based on postal code (PLZ)
   - 15-minute resolution with real-time updates
   - Cached for 15 minutes to minimize API calls
   - Displayed alongside national data for local grid insight

4. **Mock Data** - Generated demonstration data when APIs fail

**Result**: Up to 43+ hours of forecast data with high-quality renewable share information for the first 24 hours.

📖 See [DATA-MERGE-STRATEGY.md](docs/DATA-MERGE-STRATEGY.md) for detailed information about the data merging logic.

## Regional Data Feature

The app now supports **regional renewable energy data** based on your postal code:

### How to Use:
1. Open the settings menu (⋮ icon in the top right)
2. Scroll to the "REGION" section
3. Enter your 5-digit postal code (PLZ)
4. The app will display two charts:
   - **National**: Germany-wide renewable energy share
   - **Regional (PLZ)**: Local grid renewable energy share for your area

### What You'll See:
- Side-by-side comparison of national vs. regional renewable energy
- Gray bars indicate missing regional data (API doesn't have data for that time)
- Regional data updates automatically every 15 minutes
- Works without internet if you've loaded data previously (cached)

### Privacy:
- Your postal code is stored locally on your device only
- No data is sent to any server except the Energy Charts API
- You can clear your postal code at any time in settings

### Technical Details: Cloudflare Worker (CORS Proxy)

The regional data feature uses a **Cloudflare Worker** to proxy requests to the Energy Charts Signal API. This is necessary because the Energy Charts Signal API doesn't support CORS headers by default, which prevents direct browser access.

**What the Cloudflare Worker does:**
1. **Accepts requests** with postal code parameter: `/api/regional?plz=12345`
2. **Fetches data** from Energy Charts Signal API: `https://api.energy-charts.info/signal?country=de&postal_code={plz}`
3. **Adds CORS headers** to the response, allowing browser requests from any origin
4. **Caches responses**:
   - Browser cache: 15 minutes (900s)
   - Cloudflare cache: 1 hour (3600s)
5. **Handles errors** gracefully with proper HTTP status codes

**Why it's needed:**
- Browsers enforce CORS (Cross-Origin Resource Sharing) for security
- Energy Charts API doesn't provide CORS headers for the Signal endpoint
- The Worker acts as a transparent proxy with CORS support

**Deployment:**
- Hosted on Cloudflare Pages
- Automatically deployed via GitHub Actions
- No API keys or authentication required (public data only)

## Testing & Environments

The app supports three separate environments for development, testing, and production:

- **Production** (`main` branch): https://s540d.github.io/Energy_Price_Germany/
- **Staging** (`staging` branch): https://s540d.github.io/Energy_Price_Germany/staging/
- **Testing** (`testing` branch): https://s540d.github.io/Energy_Price_Germany/testing/

Each environment has its own EXPO_ENV configuration, .env file, and deployment URL.

**For detailed testing workflows, environment setup, and troubleshooting, see [TESTING.md](docs/TESTING.md)**

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/S540d/Energy_Price_Germany.git
   cd Energy_Price_Germany
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. For web deployment:
   ```bash
   npm run web
   ```

## Build & Deploy

### Web Build
```bash
npm run build:web
```

### Deploy to GitHub Pages
```bash
npm run deploy
```

## Scripts

- `npm start` - Start Expo development server
- `npm run web` - Start web development server
- `npm run build:web` - Build for web deployment
- `npm run data:update` - Update market data
- `npm run cache:update` - Update cache version
- `npm run version:update` - Bump version and update cache

## Technologies

- **React Native** - Cross-platform mobile development
- **Expo** - Framework for universal React applications
- **Victory Native** - Charting library for React Native
- **TypeScript** - Type-safe JavaScript
- **React Native SVG** - SVG support for charts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.