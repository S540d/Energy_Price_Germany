import { eurPerMwhToCtPerKwh } from '../priceUnits';

describe('eurPerMwhToCtPerKwh', () => {
  it('converts EUR/MWh to ct/kWh (1 EUR/MWh = 0.1 ct/kWh)', () => {
    expect(eurPerMwhToCtPerKwh(100)).toBeCloseTo(10);
    expect(eurPerMwhToCtPerKwh(0)).toBe(0);
    expect(eurPerMwhToCtPerKwh(-20)).toBeCloseTo(-2);
  });

  it('is bit-identical to the former inline `* 0.1`', () => {
    for (const v of [33.33, 87.1, 123.456, -0.07]) {
      expect(eurPerMwhToCtPerKwh(v)).toBe(v * 0.1);
    }
  });
});
