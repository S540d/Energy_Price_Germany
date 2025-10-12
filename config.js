/**
 * Central configuration for EnergyPriceGermany
 * 
 * ⚠️ IMPORTANT: This is the SINGLE SOURCE OF TRUTH for all paths!
 * If you need to change the data path, change it HERE ONLY.
 */

module.exports = {
  // Data file paths (relative to project root)
  paths: {
    // Source path where data is stored in the repository
    dataSource: 'public/data',
    // Filename of the market data file
    dataFile: 'marketdata.json',
    // Archive directory for historical data
    archiveDir: 'archive',
  },

  // Build configuration
  build: {
    // Output directory for production build
    distDir: 'dist',
    // Base URL for GitHub Pages deployment
    baseUrl: '/Energy_Price_Germany',
  },

  // API configuration
  api: {
    energyCharts: {
      renewableUrl: 'https://api.energy-charts.info/ren_share_forecast?country=de',
      priceUrl: 'https://api.energy-charts.info/price?country=de',
    },
    awattar: {
      url: 'https://api.awattar.de/v1/marketdata',
    },
  },

  // Helper functions to construct full paths
  getDataPath() {
    return `${this.paths.dataSource}/${this.paths.dataFile}`;
  },
  getArchivePath() {
    return `${this.paths.dataSource}/${this.paths.archiveDir}`;
  },
  getDistDataPath() {
    return `${this.build.distDir}/${this.paths.dataSource.replace('public/', '')}/${this.paths.dataFile}`;
  },
  // Path for frontend to load data (relative URL)
  getFrontendDataPath() {
    return `./data/${this.paths.dataFile}`;
  },
};
