/**
 * Interpolates between two RGB colors by a factor 0..1
 */
function interpolateColor(color1: number[], color2: number[], factor: number): string {
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * factor);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * factor);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Maps a total end-customer price (¢/kWh) to a color.
 * Green = cheap (<25¢), Yellow = medium (25–<50¢), Red = expensive (>=50¢).
 * Shared between PriceBarChart and ClockChart to keep colors in sync.
 */
export function getPriceColor(totalPrice: number): string {
  const green = [76, 175, 80];
  const yellow = [255, 193, 7];
  const red = [244, 67, 54];

  if (totalPrice < 25) return '#4CAF50';
  if (totalPrice < 35) return interpolateColor(green, yellow, (totalPrice - 25) / 10);
  if (totalPrice < 50) return interpolateColor(yellow, red, (totalPrice - 35) / 15);
  return '#F44336';
}

/**
 * Berechnet die Position für rotierte Y-Achsen-Beschriftungen
 * Bei -90deg Rotation: 'top' steuert die horizontale Position (links/rechts)
 *
 * @param chartHeight - Höhe des Charts in Pixeln
 * @param horizontalOffset - Horizontale Verschiebung (höhere Werte = weiter rechts)
 * @returns Die top-Position für die horizontale Zentrierung
 */
export function getYAxisLabelCenterPosition(
  chartHeight: number,
  horizontalOffset: number = 0
): number {
  // Bei -90deg Rotation bestimmt 'top' die horizontale Position
  // Um den Text horizontal zu zentrieren, muss top = chartHeight/2 + offset sein
  return chartHeight / 2 + horizontalOffset;
}

/**
 * Gibt die vollständigen Style-Properties für eine Y-Achsen-Beschriftung zurück
 *
 * @param chartHeight - Höhe des Charts in Pixeln
 * @param horizontalOffset - Horizontale Verschiebung (höhere Werte = weiter rechts)
 * @param textColor - Textfarbe
 * @param isPhone - Optional: Ob das Gerät ein Phone ist (für responsives Layout)
 * @returns Style-Objekt für die Y-Achsen-Beschriftung
 */
export function getYAxisLabelStyle(
  chartHeight: number,
  horizontalOffset: number = 0,
  textColor: string = '#333',
  isPhone: boolean = false
) {
  // Auf Phones mehr Abstand zur Y-Achse für bessere Lesbarkeit
  const leftOffset = isPhone ? -95 : -90;

  return {
    position: 'absolute' as const,
    left: leftOffset,
    top: getYAxisLabelCenterPosition(chartHeight, horizontalOffset),
    fontSize: 12,
    color: textColor,
    opacity: 0.6,
    fontWeight: '600' as const,
    transform: [{ rotate: '-90deg' }],
    width: 200,
    textAlign: 'center' as const,
  };
}
