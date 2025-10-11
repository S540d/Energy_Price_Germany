import { Dimensions, useColorScheme } from 'react-native';

export interface ChartDimensions {
  chartHeight: number;
  chartWidth: number;
  leftPadding: number;
  padding: number;
  bottomPadding: number;
  isPhone: boolean;
  isSmallScreen: boolean;
}

/**
 * Berechnet responsive Chart-Dimensionen basierend auf Bildschirmgröße
 */
export function useChartDimensions(): ChartDimensions {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const isSmallScreen = screenWidth < 768;
  const isPhone = screenWidth < 480;

  // Responsive Chart-Größen
  const chartHeight = isPhone ? 140 : isSmallScreen ? 160 : 180;
  const leftPadding = isPhone ? 35 : 45;
  const padding = 40;
  const bottomPadding = isPhone ? 40 : 50;

  // Maximale Chart-Breite basierend auf Bildschirmgröße
  const maxChartWidth = isPhone
    ? screenWidth - 24  // Fast voller Bildschirm auf Phone
    : isSmallScreen
    ? Math.min(chartHeight * 2.5, screenWidth - 24)
    : Math.min(chartHeight * 3.5, screenWidth - 48);

  const chartWidth = maxChartWidth;

  return {
    chartHeight,
    chartWidth,
    leftPadding,
    padding,
    bottomPadding,
    isPhone,
    isSmallScreen,
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