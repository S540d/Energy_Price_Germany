import type { Skia } from "../skia/types";
import { Container, StaticContainer } from "./StaticContainer";
import "../skia/NativeSetup";
import "../views/api";
declare class NativeReanimatedContainer extends Container {
    private nativeId;
    private mapperId;
    private picture;
    constructor(Skia: Skia, nativeId: number);
    redraw(): void;
}
export declare const createContainer: (Skia: Skia, nativeId: number) => StaticContainer | NativeReanimatedContainer;
export {};
