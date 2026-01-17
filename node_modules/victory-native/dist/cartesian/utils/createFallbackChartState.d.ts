import type { InputFields, NumericalFields } from "../../types";
/**
 * Helper for creating "fallback" chart state if there's no data.
 * Prevents crashes due to null/empty scales & arrays.
 */
export declare function createFallbackChartState<RawData extends Record<string, unknown>, XK extends keyof InputFields<RawData>, YK extends keyof NumericalFields<RawData>>(yKeys: YK[]): {
    yAxes: {
        yScale: import("d3-scale").ScaleLinear<number, number, never> | import("d3-scale").ScaleLogarithmic<number, number, never>;
        yTicksNormalized: never[];
    }[];
    xScale: import("d3-scale").ScaleLinear<number, number, never> | import("d3-scale").ScaleLogarithmic<number, number, never>;
    chartBounds: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    isNumericalData: boolean;
    xTicksNormalized: number[];
    _tData: {
        ix: never[];
        ox: never[];
        y: { [K in YK]: {
            i: import("../../types").MaybeNumber[];
            o: import("../../types").MaybeNumber[];
        }; };
    };
};
