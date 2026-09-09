import {
  renewableFallbackFromEnergyData,
  renewableFallbackFromRegionalResponse,
  resolveRenewableKpi,
} from '../renewableFallback';
import type { EnergyData } from '../metrics';

const NOW = new Date('2026-09-08T17:34:00+02:00');

function point(offsetMinutes: number, regional: number | null | undefined): EnergyData {
  return {
    timestamp: NOW.getTime() + offsetMinutes * 60_000,
    marketPrice: 50,
    renewableShare: null,
    renewableShareRegional: regional,
  };
}

describe('renewableFallbackFromEnergyData', () => {
  it('liefert den regionalen Wert am nächsten an jetzt als current', () => {
    const result = renewableFallbackFromEnergyData([point(-10, 40), point(-60, 90)], NOW);
    expect(result?.current).toBe(40);
    expect(result?.source).toBe('own');
  });

  it('liefert die heutigen Einzelwerte als series, für die Chart-Balken (#481)', () => {
    // -20h liegt am Vortag und darf nicht in der series landen.
    const result = renewableFallbackFromEnergyData(
      [point(-20 * 60, 10), point(-60, 40), point(-30, 60)],
      NOW
    );
    expect(result?.series).toEqual([
      { timestamp: point(-60, 40).timestamp, value: 40 },
      { timestamp: point(-30, 60).timestamp, value: 60 },
    ]);
  });

  it('mittelt nur über die heutigen Punkte', () => {
    // -20 h liegt am Vortag und darf nicht ins Tagesmittel einfließen.
    const result = renewableFallbackFromEnergyData(
      [point(-20 * 60, 10), point(-60, 40), point(-30, 60)],
      NOW
    );
    expect(result?.avg).toBe(50);
  });

  it('setzt current auf null, wenn kein Punkt im Toleranzfenster liegt', () => {
    const result = renewableFallbackFromEnergyData([point(-120, 55)], NOW);
    expect(result?.current).toBeNull();
    expect(result?.avg).toBe(55);
  });

  it('liefert null, wenn es überhaupt keine regionalen Werte gibt', () => {
    expect(
      renewableFallbackFromEnergyData([point(-10, null), point(-20, undefined)], NOW)
    ).toBeNull();
  });

  it('liefert null bei leerer Eingabe', () => {
    expect(renewableFallbackFromEnergyData([], NOW)).toBeNull();
  });
});

describe('renewableFallbackFromRegionalResponse', () => {
  const seconds = (offsetMinutes: number) => Math.floor(NOW.getTime() / 1000) + offsetMinutes * 60;

  it('berechnet current und Tagesmittel aus der Signal-API-Antwort', () => {
    const result = renewableFallbackFromRegionalResponse(
      { unix_seconds: [seconds(-15), seconds(-45)], share: [30, 50] },
      NOW
    );
    expect(result?.current).toBe(30);
    expect(result?.avg).toBe(40);
    expect(result?.source).toBe('default');
  });

  it('kappt Werte auf 0–100 wie der dataMerger', () => {
    const result = renewableFallbackFromRegionalResponse(
      { unix_seconds: [seconds(-5)], share: [125] },
      NOW
    );
    expect(result?.current).toBe(100);
  });

  it('kappt auch die Werte in series auf 0–100 (#481)', () => {
    const result = renewableFallbackFromRegionalResponse(
      { unix_seconds: [seconds(-5)], share: [125] },
      NOW
    );
    expect(result?.series).toEqual([{ timestamp: seconds(-5) * 1000, value: 100 }]);
  });

  it('liefert null bei ungleich langen Arrays', () => {
    expect(
      renewableFallbackFromRegionalResponse({ unix_seconds: [seconds(-5)], share: [] }, NOW)
    ).toBeNull();
  });

  it('liefert null bei leerer Antwort (stummer API-Ausfall)', () => {
    expect(renewableFallbackFromRegionalResponse({ unix_seconds: [], share: [] }, NOW)).toBeNull();
    expect(renewableFallbackFromRegionalResponse(null, NOW)).toBeNull();
  });
});

describe('resolveRenewableKpi', () => {
  const fallback = { current: 88, avg: 77, source: 'default' as const };

  it('bevorzugt nationale Werte und markiert nichts als Fallback', () => {
    const result = resolveRenewableKpi({ current: 42, avg: 45 }, fallback);
    expect(result).toEqual({
      current: 42,
      avg: 45,
      usesFallback: false,
      fallbackSource: null,
    });
  });

  it('behält nationale Werte auch bei fehlendem current – mischt nicht mit dem Ortswert', () => {
    // Sonst stünde ein aktueller Ortswert neben einem nationalen Tages-Ø;
    // die beiden Zahlen messen Unterschiedliches.
    const result = resolveRenewableKpi({ current: null, avg: 45 }, fallback);
    expect(result.current).toBeNull();
    expect(result.avg).toBe(45);
    expect(result.usesFallback).toBe(false);
  });

  it('greift auf den Ortswert zurück, wenn national heute gar nichts vorliegt', () => {
    const result = resolveRenewableKpi({ current: null, avg: null }, fallback);
    expect(result).toEqual({
      current: 88,
      avg: 77,
      usesFallback: true,
      fallbackSource: 'default',
    });
  });

  it('behält die eigene PLZ als Quelle bei', () => {
    const result = resolveRenewableKpi(null, { current: 30, avg: 35, source: 'own' });
    expect(result.usesFallback).toBe(true);
    expect(result.fallbackSource).toBe('own');
  });

  it('liefert leere Werte ohne Fallback-Kennzeichnung, wenn es nichts anzuzeigen gibt', () => {
    expect(resolveRenewableKpi(undefined, null)).toEqual({
      current: null,
      avg: null,
      usesFallback: false,
      fallbackSource: null,
    });
  });
});
