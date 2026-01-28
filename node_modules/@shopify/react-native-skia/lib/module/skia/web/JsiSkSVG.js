import { HostObject } from "./Host";
export class JsiSkSVG extends HostObject {
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
//# sourceMappingURL=JsiSkSVG.js.map