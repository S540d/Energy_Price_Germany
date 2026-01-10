import { type ScaleLinear, type ScaleLogarithmic } from "d3-scale";
import type { AxisScaleType } from "../../types";
export declare const makeScale: ({ inputBounds, outputBounds, padStart, padEnd, viewport, isNice, axisScale, }: {
    inputBounds: [number, number];
    outputBounds: [number, number];
    viewport?: [number, number];
    padStart?: number;
    padEnd?: number;
    isNice?: boolean;
    axisScale?: AxisScaleType;
}) => ScaleLinear<number, number> | ScaleLogarithmic<number, number>;
