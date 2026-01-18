"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFallbackChartState = void 0;
const makeScale_1 = require("./makeScale");
/**
 * Helper for creating "fallback" chart state if there's no data.
 * Prevents crashes due to null/empty scales & arrays.
 */
function createFallbackChartState(yKeys) {
    const fallbackScale = (0, makeScale_1.makeScale)({
        inputBounds: [0, 1],
        outputBounds: [0, 1],
    });
    return {
        yAxes: [
            {
                yScale: fallbackScale,
                yTicksNormalized: [],
            },
        ],
        xScale: fallbackScale,
        chartBounds: { left: 0, right: 0, top: 0, bottom: 0 },
        isNumericalData: false,
        xTicksNormalized: [],
        _tData: {
            ix: [],
            ox: [],
            y: yKeys.reduce((acc, key) => {
                acc[key] = { i: [], o: [] };
                return acc;
            }, {}),
        },
    };
}
exports.createFallbackChartState = createFallbackChartState;
