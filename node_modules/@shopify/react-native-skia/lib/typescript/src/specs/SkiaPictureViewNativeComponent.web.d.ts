import type { ViewProps } from "react-native";
export interface NativeProps extends ViewProps {
    debug?: boolean;
    opaque?: boolean;
    nativeID: string;
}
declare const SkiaPictureViewNativeComponent: ({ nativeID, debug, opaque, onLayout, ...viewProps }: NativeProps) => import("react").FunctionComponentElement<import("../views/SkiaPictureView.web").SkiaPictureViewProps>;
export default SkiaPictureViewNativeComponent;
