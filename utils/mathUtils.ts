/**
 * Safe replacements for `Math.min(...arr)` / `Math.max(...arr)`.
 *
 * Spreading a large array into `Math.min`/`Math.max` hits the JS engine's
 * argument-count ceiling (RangeError: Maximum call stack size exceeded on
 * Hermes/JSC) once the array grows large enough. These reduce in O(n)
 * without ever building a call-argument list, so they have no upper bound.
 * Empty-array behavior matches `Math.min()`/`Math.max()` with no arguments.
 */
export function arrayMin(values: number[]): number {
  let min = Infinity;
  for (const v of values) {
    if (v < min) min = v;
  }
  return min;
}

export function arrayMax(values: number[]): number {
  let max = -Infinity;
  for (const v of values) {
    if (v > max) max = v;
  }
  return max;
}
