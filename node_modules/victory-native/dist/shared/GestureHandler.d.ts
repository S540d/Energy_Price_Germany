import { type ComposedGesture, type GestureType } from "react-native-gesture-handler";
import { type SkRect } from "@shopify/react-native-skia";
import * as React from "react";
import { type ChartTransformState } from "../cartesian/hooks/useChartTransformState";
import type { GestureHandlerConfig } from "../types";
type GestureHandlerProps = {
    gesture: ComposedGesture | GestureType;
    dimensions: SkRect;
    transformState?: ChartTransformState;
    debug?: boolean;
    config?: GestureHandlerConfig;
};
export declare const GestureHandler: ({ gesture, dimensions, transformState, debug, config, }: GestureHandlerProps) => React.JSX.Element;
export {};
