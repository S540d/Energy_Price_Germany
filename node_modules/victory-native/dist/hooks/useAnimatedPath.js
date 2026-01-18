"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAnimatedPath = void 0;
const react_native_skia_1 = require("@shopify/react-native-skia");
const React = __importStar(require("react"));
const react_native_reanimated_1 = require("react-native-reanimated");
function isWithDecayConfig(config) {
    return config.type === "decay";
}
function isWithTimingConfig(config) {
    return config.type === "timing";
}
function isWithSpringConfig(config) {
    return config.type === "spring";
}
const useAnimatedPath = (currentPathProp, animConfig = { type: "timing", duration: 300 }) => {
    const progressSV = (0, react_native_reanimated_1.useSharedValue)(0);
    // fromPathSV stores the SkPath object we are animating FROM. Initialized with a copy.
    const fromPathSV = (0, react_native_reanimated_1.useSharedValue)(currentPathProp.copy());
    // targetPathSV stores the SkPath object we are animating TO. Initialized with a copy.
    const targetPathSV = (0, react_native_reanimated_1.useSharedValue)(currentPathProp.copy());
    // This effect synchronizes prop changes to our shared values and triggers animations.
    React.useEffect(() => {
        // The current `targetPathSV.value` was the target of the *previous* animation (or initial state).
        // This becomes the starting point for our new animation.
        // Ensure we use .copy() to avoid shared mutable object issues.
        fromPathSV.value = targetPathSV.value.copy();
        // The new `currentPathProp` is our new animation target.
        targetPathSV.value = currentPathProp.copy();
        // Reset progress and start animation
        progressSV.value = 0;
        if (isWithTimingConfig(animConfig)) {
            progressSV.value = (0, react_native_reanimated_1.withTiming)(1, animConfig);
        }
        else if (isWithSpringConfig(animConfig)) {
            progressSV.value = (0, react_native_reanimated_1.withSpring)(1, animConfig);
        }
        else if (isWithDecayConfig(animConfig)) {
            progressSV.value = (0, react_native_reanimated_1.withDecay)(animConfig);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPathProp, animConfig]);
    const animatedPath = (0, react_native_reanimated_1.useDerivedValue)(() => {
        const t = progressSV.value;
        const from = fromPathSV.value;
        const to = targetPathSV.value;
        if (t === 0) {
            return from;
        }
        if (t === 1) {
            return to;
        }
        // 1. Try direct Skia interpolation first (most performant and reliable)
        if (to && from && to.isInterpolatable(from)) {
            const interpolated = to.interpolate(from, t);
            if (interpolated) {
                return interpolated;
            }
        }
        // 2. Fallback: SVG string manipulation with precision normalization
        // This was identified as potentially problematic for pie charts if direct interpolation failed.
        const normalizePrecision = (svgPathStr) => svgPathStr.replace(/(\d+\.\d+)/g, (match) => parseFloat(match).toFixed(3));
        const toSVG = to === null || to === void 0 ? void 0 : to.toSVGString();
        const fromSVG = from === null || from === void 0 ? void 0 : from.toSVGString();
        if (toSVG && fromSVG) {
            const toNormalized = react_native_skia_1.Skia.Path.MakeFromSVGString(normalizePrecision(toSVG));
            const fromNormalized = react_native_skia_1.Skia.Path.MakeFromSVGString(normalizePrecision(fromSVG));
            if (toNormalized &&
                fromNormalized &&
                toNormalized.isInterpolatable(fromNormalized)) {
                const interpolatedNormalized = toNormalized.interpolate(fromNormalized, t);
                if (interpolatedNormalized) {
                    return interpolatedNormalized;
                }
            }
        }
        // 3. Final fallback: if all interpolation fails, snap to the closest path
        return t > 0.5 ? to : from;
    }, []);
    return animatedPath;
};
exports.useAnimatedPath = useAnimatedPath;
