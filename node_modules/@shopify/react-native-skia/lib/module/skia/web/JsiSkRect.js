import { BaseHostObject } from "./Host";
export class JsiSkRect extends BaseHostObject {
  static fromValue(CanvasKit, rect) {
    if (rect instanceof JsiSkRect) {
      return rect.ref;
    }
    return CanvasKit.XYWHRect(rect.x, rect.y, rect.width, rect.height);
  }
  constructor(CanvasKit, ref) {
    super(CanvasKit, ref, "Rect");
  }
  setXYWH(x, y, width, height) {
    this.ref[0] = x;
    this.ref[1] = y;
    this.ref[2] = x + width;
    this.ref[3] = y + height;
  }
  get x() {
    return this.ref[0];
  }
  get y() {
    return this.ref[1];
  }
  get width() {
    return this.ref[2] - this.ref[0];
  }
  get height() {
    return this.ref[3] - this.ref[1];
  }
}
//# sourceMappingURL=JsiSkRect.js.map