/**
 * Preis-Einheiten: Börsenpreise kommen in EUR/MWh, angezeigt wird in ct/kWh.
 * 1 EUR/MWh = 0,1 ct/kWh.
 *
 * Bewusst `* 0.1` (nicht `/ 10`): Gleitkomma-Ergebnisse bleiben bitgleich zu den
 * zuvor verteilten Inline-Umrechnungen.
 */
export const CT_PER_KWH_PER_EUR_PER_MWH = 0.1;

export function eurPerMwhToCtPerKwh(eurPerMwh: number): number {
  return eurPerMwh * CT_PER_KWH_PER_EUR_PER_MWH;
}
