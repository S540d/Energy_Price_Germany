import { Platform } from 'react-native';
import { EnergyData } from '../utils/metrics';

/**
 * Exportiert Energiedaten als CSV-Datei
 */
export function exportAsCSV(data: EnergyData[]): void {
  const csv = [
    'Zeitstempel,Börsenstrompreis (EUR/MWh),Anteil Erneuerbarer (%)',
    ...data.map(d =>
      `${new Date(d.timestamp).toISOString()},${d.marketPrice?.toFixed(2) ?? 'N/A'},${d.renewableShare?.toFixed(2) ?? 'N/A'}`
    ),
  ].join('\n');

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'energy_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Exportiert Energiedaten als JSON-Datei
 */
export function exportAsJSON(data: EnergyData[]): void {
  const json = JSON.stringify(data, null, 2);

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'energy_data.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}