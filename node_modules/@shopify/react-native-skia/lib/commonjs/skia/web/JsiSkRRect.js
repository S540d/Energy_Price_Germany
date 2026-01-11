"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JsiSkRRect = void 0;
var _Host = require("./Host");
var _JsiSkRect = require("./JsiSkRect");
class JsiSkRRect extends _Host.BaseHostObject {
  [Symbol.dispose]() {
    // nothing to do here, RRect is a Float32Array
  }
  static fromValue(CanvasKit, rect) {
    if (rect instanceof _JsiSkRect.JsiSkRect) {
      return rect.ref;
    }
    if ("topLeft" in rect && "topRight" in rect && "bottomRight" in rect && "bottomLeft" in rect) {
      return Float32Array.of(rect.rect.x, rect.rect.y, rect.rect.x + rect.rect.width, rect.rect.y + rect.rect.height, rect.topLeft.x, rect.topLeft.y, rect.topRight.x, rect.topRight.y, rect.bottomRight.x, rect.bottomRight.y, rect.bottomLeft.x, rect.bottomLeft.y);
    }
    return CanvasKit.RRectXY(_JsiSkRect.JsiSkRect.fromValue(CanvasKit, rect.rect), rect.rx, rect.ry);
  }
  constructor(CanvasKit, rect, rx, ry) {
    // based on https://github.com/google/skia/blob/main/src/core/SkRRect.cpp#L51
    if (rx === Infinity || ry === Infinity) {
      rx = ry = 0;
    }
    if (rect.width < rx + rx || rect.height < ry + ry) {
      // At most one of these two divides will be by zero, and neither numerator is zero.
      const scale = Math.min(rect.width / (rx + rx), rect.height / (ry + ry));
      rx *= scale;
      ry *= scale;
    }
    const ref = CanvasKit.RRectXY(_JsiSkRect.JsiSkRect.fromValue(CanvasKit, rect), rx, ry);
    super(CanvasKit, ref, "RRect");
  }
  get rx() {
    return this.ref[4];
  }
  get ry() {
    return this.ref[5];
  }
  get rect() {
    return new _JsiSkRect.JsiSkRect(this.CanvasKit, Float32Array.of(this.ref[0], this.ref[1], this.ref[2], this.ref[3]));
  }
}
exports.JsiSkRRect = JsiSkRRect;
//# sourceMappingURL=JsiSkRRect.js.map