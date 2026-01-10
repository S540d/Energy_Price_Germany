"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JsiSkAnimatedImage = void 0;
var _Host = require("./Host");
var _JsiSkImage = require("./JsiSkImage");
class JsiSkAnimatedImage extends _Host.HostObject {
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
    return new _JsiSkImage.JsiSkImage(this.CanvasKit, image);
  }
}
exports.JsiSkAnimatedImage = JsiSkAnimatedImage;
//# sourceMappingURL=JsiSkAnimatedImage.js.map