"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JsiSkSurface = void 0;
var _Host = require("./Host");
var _JsiSkCanvas = require("./JsiSkCanvas");
var _JsiSkImage = require("./JsiSkImage");
var _JsiSkRect = require("./JsiSkRect");
class JsiSkSurface extends _Host.HostObject {
  constructor(CanvasKit, ref) {
    super(CanvasKit, ref, "Surface");
  }
  [Symbol.dispose]() {
    this.ref.dispose();
  }
  flush() {
    this.ref.flush();
  }
  width() {
    return this.ref.width();
  }
  height() {
    return this.ref.height();
  }
  getCanvas() {
    return new _JsiSkCanvas.JsiSkCanvas(this.CanvasKit, this.ref.getCanvas());
  }
  makeImageSnapshot(bounds, outputImage) {
    const image = this.ref.makeImageSnapshot(bounds ? Array.from(_JsiSkRect.JsiSkRect.fromValue(this.CanvasKit, bounds)) : undefined);
    if (outputImage) {
      outputImage.ref = image;
    }
    return new _JsiSkImage.JsiSkImage(this.CanvasKit, image);
  }
  getNativeTextureUnstable() {
    console.warn("getBackendTexture is not implemented on Web");
    return null;
  }
}
exports.JsiSkSurface = JsiSkSurface;
//# sourceMappingURL=JsiSkSurface.js.map