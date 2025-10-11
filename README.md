# Energy Price Germany

A React Native/Expo app for visualizing energy prices and renewable energy share in Germany. This project provides real-time data visualization of electricity market prices and the percentage of renewable energy in the grid.

## Features

- **Real-time Data**: Fetches current energy market data from reliable sources
- **Interactive Charts**: Visualize price trends and renewable energy share over time
- **Correlation Analysis**: See the relationship between energy prices and renewable energy availability
- **Responsive Design**: Works on web, iOS, and Android
- **Dark/Light Theme**: Automatic system theme detection with manual override
- **Data Export**: Export data as CSV or JSON for further analysis

## Data Sources

The app prioritizes data from:
1. **Energy Charts (Fraunhofer ISE)** - Primary source for renewable energy share
2. **aWATTar (EPEX Spot Market Data)** - Fallback for market prices
3. **Mock Data** - Generated data for demonstration when APIs are unavailable

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