import { renderHook } from '@testing-library/react-native';
import { usePriceAlertState } from '../usePriceAlertState';

describe('usePriceAlertState', () => {
  const render = (price: number | null) =>
    renderHook(({ p }: { p: number | null }) => usePriceAlertState(p, 20, 40), {
      initialProps: { p: price },
    });

  it('holds the high alert while the price hovers just below the threshold', () => {
    const { result, rerender } = render(41);
    expect(result.current).toBe('high');
    rerender({ p: 39.8 });
    expect(result.current).toBe('high');
    rerender({ p: 39 });
    expect(result.current).toBe('none');
  });

  it('does not enter the alert inside the hysteresis band', () => {
    const { result, rerender } = render(30);
    rerender({ p: 39.8 });
    expect(result.current).toBe('none');
  });
});
