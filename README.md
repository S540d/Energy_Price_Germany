# Energy Price Germany

A React Native/Expo app for visualizing energy prices and renewable energy share in Germany. This project provides real-time data visualization of electricity market prices and the percentage of renewable energy in the grid.

## Features

- **Real-time Data**: Fetches current energy market data from reliable sources
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

3. **Mock Data** - Generated demonstration data when both APIs fail

**Result**: Up to 43+ hours of forecast data with high-quality renewable share information for the first 24 hours.

📖 See [DATA-MERGE-STRATEGY.md](DATA-MERGE-STRATEGY.md) for detailed information about the data merging logic.

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

## Support

If you find this project helpful, consider buying me a coffee: [Buy Me a Coffee](https://buymeacoffee.com/sven4321)

---

Deployment triggered.