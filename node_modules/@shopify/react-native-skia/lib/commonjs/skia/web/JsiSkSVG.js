"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JsiSkSVG = void 0;
var _Host = require("./Host");
class JsiSkSVG extends _Host.HostObject {
  constructor(CanvasKit, ref) {
    super(CanvasKit, ref, "SVG");
  }
  width() {
    return this.ref.width;
  }
  height() {
    return this.ref.height;
  }
  [Symbol.dispose]() {
    if (this.ref.parentNode) {
      this.ref.parentNode.removeChild(this.ref);
    }
  }
}
exports.JsiSkSVG = JsiSkSVG;
//# sourceMappingURL=JsiSkSVG.js.map