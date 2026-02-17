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
    left: leftOffset, // Responsiver Abstand vom oberen Rand
    top: getYAxisLabelCenterPosition(chartHeight, horizontalOffset),
    fontSize: 12,
    color: textColor,
    fontWeight: '600' as const,
    transform: [{ rotate: '-90deg' }],
    width: 200,
    textAlign: 'center' as const,
  };
}
