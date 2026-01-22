import React from "react";
import type { SkRect, SkPicture, SkImage } from "../skia/types";
import type { SkiaPictureViewNativeProps } from "./types";
export interface SkiaPictureViewHandle {
    setPicture(picture: SkPicture): void;
    getSize(): {
        width: number;
        height: number;
    };
    redraw(): void;
    makeImageSnapshot(rect?: SkRect): SkImage | null;
    measure(callback: (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => void): void;
    measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void;
}
export interface SkiaPictureViewProps extends SkiaPictureViewNativeProps {
    ref?: React.Ref<SkiaPictureViewHandle>;
}
export declare const SkiaPictureView: (props: SkiaPictureViewProps) => React.JSX.Element;
