import { HostObject } from "./Host";
import { JsiSkCanvas } from "./JsiSkCanvas";
import { JsiSkImage } from "./JsiSkImage";
import { JsiSkRect } from "./JsiSkRect";
export class JsiSkSurface extends HostObject {
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
    return new JsiSkCanvas(this.CanvasKit, this.ref.getCanvas());
  }
  makeImageSnapshot(bounds, outputImage) {
    const image = this.ref.makeImageSnapshot(bounds ? Array.from(JsiSkRect.fromValue(this.CanvasKit, bounds)) : undefined);
    if (outputImage) {
      outputImage.ref = image;
    }
    return new JsiSkImage(this.CanvasKit, image);
  }
  getNativeTextureUnstable() {
    console.warn("getBackendTexture is not implemented on Web");
    return null;
  }
}
//# sourceMappingURL=JsiSkSurface.js.map