import { HostObject } from "./Host";
import { JsiSkImage } from "./JsiSkImage";
export class JsiSkAnimatedImage extends HostObject {
  constructor(CanvasKit, ref) {
    super(CanvasKit, ref, "AnimatedImage");
  }
  decodeNextFrame() {
    return this.ref.decodeNextFrame();
  }
  currentFrameDuration() {
    return this.ref.currentFrameDuration();
  }
  getFrameCount() {
    return this.ref.getFrameCount();
  }
  getCurrentFrame() {
    const image = this.ref.makeImageAtCurrentFrame();
    if (image === null) {
      return null;
    }
    return new JsiSkImage(this.CanvasKit, image);
  }
}
//# sourceMappingURL=JsiSkAnimatedImage.js.map