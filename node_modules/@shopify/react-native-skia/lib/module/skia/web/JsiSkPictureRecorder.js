import { HostObject } from "./Host";
import { JsiSkCanvas } from "./JsiSkCanvas";
import { JsiSkPicture } from "./JsiSkPicture";
import { JsiSkRect } from "./JsiSkRect";
export class JsiSkPictureRecorder extends HostObject {
  constructor(CanvasKit, ref) {
    super(CanvasKit, ref, "PictureRecorder");
  }
  beginRecording(bounds) {
    return new JsiSkCanvas(this.CanvasKit, this.ref.beginRecording(bounds ? JsiSkRect.fromValue(this.CanvasKit, bounds) : Float32Array.of(0, 0, 2_000_000, 2_000_000)));
  }
  finishRecordingAsPicture() {
    return new JsiSkPicture(this.CanvasKit, this.ref.finishRecordingAsPicture());
  }
}
//# sourceMappingURL=JsiSkPictureRecorder.js.map