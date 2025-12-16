import { useMemo } from 'react';
import { Dimensions } from 'react-native';

export interface ChartDimensions {
  chartHeight: number;
  chartWidth: number;
  leftPadding: number;
  padding: number;
  rightPadding: number;
  bottomPadding: number;
  margin: number;
  cardPadding: number;
  isPhone: boolean;
  isSmallScreen: boolean;
  screenWidth: number;
  screenHeight: number;
}

/**
 * Berechnet responsive Chart-Dimensionen basierend auf Bildschirmgröße
 * Viewport-bewusst für optimale Darstellung auf allen Geräten
 */
export function useChartDimensions(): ChartDimensions {
  const screenWidth = useMemo(() => Dimensions.get('window').width, []);
  const screenHeight = useMemo(() => Dimensions.get('window').height, []);
  const isSmallScreen = screenWidth < 768;
  const isPhone = screenWidth < 480;

  // Responsive Padding-Werte
  const leftPadding = isPhone ? 35 : 45;
  const padding = 40;
  const rightPadding = isPhone ? 20 : 50;
  const bottomPadding = isPhone ? 35 : 40;

  // Margins (8px Grid)
  const margin = isPhone ? 8 : 16;
  const cardPadding = isPhone ? 12 : 16;

  // Breite: Nutze verfügbare Bildschirmbreite optimal (minus Margins)
  const chartWidth = screenWidth - (margin * 2);

  // Höhe: Viewport-bewusst, sodass alle 3 Charts gut sichtbar sind
  const baseAspectRatio = 2.5;
  const availableHeight = screenHeight - 200; // Header + Overhead
  const maxChartHeight = availableHeight / 3.3; // 3 Charts + Gaps
  const absoluteMaxHeight = isPhone ? 200 : isSmallScreen ? 280 : 320; // Absolute Obergrenze
  const chartHeight = Math.round(Math.min(
    chartWidth / baseAspectRatio,
    maxChartHeight,
    absoluteMaxHeight
  ));

  return {
    chartHeight,
    chartWidth,
    leftPadding,
    padding,
    rightPadding,
    bottomPadding,
    margin,
    cardPadding,
    isPhone,
    isSmallScreen,
    screenWidth,
    screenHeight,
  };
}

/**
 * Berechnet Zeitbereich aus Daten
 */
export function getTimeRange(data: Array<{ timestamp: number }>) {
  const timestamps = data.map(d => d.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeRange = maxTime - minTime;

  return { minTime, maxTime, timeRange };
}

/**
 * Generiert X-Achsen Labels für Zeitachsen (alle 3 Stunden)
 */
export function generateTimeLabels(
  minTime: number,
  maxTime: number,
  leftPadding: number,
  chartWidth: number,
  timeRange: number,
  isPhone: boolean,
  textColor: string
) {
  const labels = [];
  const startDate = new Date(minTime);
  const endDate = new Date(maxTime);

  const startHour = Math.ceil(startDate.getHours() / 3) * 3;
  const current = new Date(startDate);
  current.setHours(startHour, 0, 0, 0);

  while (current <= endDate) {
    const timestamp = current.getTime();
    const x = leftPadding + ((timestamp - minTime) / timeRange) * (chartWidth - leftPadding);
    const hour = current.getHours();

    labels.push({
      key: `xlabel-${timestamp}`,
      x: x - 10,
      y: 'chartHeight + 5',
      text: `${hour}h`,
      style: {
        position: 'absolute' as const,
        left: x - 10,
        top: 'chartHeight + 5',
        fontSize: isPhone ? 9 : 10,
        color: textColor,
        opacity: 0.6,
      },
    });

    current.setHours(current.getHours() + 3);
  }

  return labels;
}

/**
 * Generiert Y-Achsen Labels
 */
export function generateYAxisLabels(
  max: number,
  min: number,
  range: number,
  padding: number,
  chartHeight: number,
  bottomPadding: number,
  isPhone: boolean,
  textColor: string,
  formatter: (value: number) => string = (v) => v.toFixed(1)
) {
  return [0, 1, 2, 3, 4].map(i => {
    const value = max - (i / 4) * range;
    const y = padding + (i / 4) * (chartHeight - padding - bottomPadding);
    return {
      key: `ylabel-${i}`,
      value,
      y,
      style: {
        position: 'absolute' as const,
        left: 8,
        top: y - 8,
        fontSize: isPhone ? 9 : 10,
        color: textColor,
        opacity: 0.6,
        textAlign: 'right' as const,
        width: isPhone ? 25 : 30,
      },
    };
  });
}