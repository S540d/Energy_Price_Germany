"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useTexture = exports.usePictureAsTexture = exports.useImageAsTexture = void 0;
var _react = require("react");
var _Offscreen = require("../../renderer/Offscreen");
var _skia = require("../../skia");
var _Platform = require("../../Platform");
var _ReanimatedProxy = _interopRequireDefault(require("./ReanimatedProxy"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const createTextureFromImage = (texture, image) => {
  "worklet";

  const surface = _skia.Skia.Surface.MakeOffscreen(image.width(), image.height());
  if (!surface) {
    texture.value = null;
    return;
  }
  const canvas = surface.getCanvas();
  canvas.drawImage(image, 0, 0);
  surface.flush();
  texture.value = surface.makeImageSnapshot();
  if (_Platform.Platform.OS === "web") {
    texture.value = texture.value.makeNonTextureImage();
  }
};
const createTexture = (texture, picture, size) => {
  "worklet";

  const surface = _skia.Skia.Surface.MakeOffscreen(size.width, size.height);
  const canvas = surface.getCanvas();
  canvas.drawPicture(picture);
  surface.flush();
  texture.value = surface.makeImageSnapshot();
  if (_Platform.Platform.OS === "web") {
    texture.value = texture.value.makeNonTextureImage();
  }
};
const useTexture = (element, size, deps) => {
  const {
    width,
    height
  } = size;
  const [picture, setPicture] = (0, _react.useState)(null);
  (0, _react.useEffect)(() => {
    (0, _Offscreen.drawAsPicture)(element, {
      x: 0,
      y: 0,
      width,
      height
    }).then(pic => {
      setPicture(pic);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps !== null && deps !== void 0 ? deps : []);
  return usePictureAsTexture(picture, size);
};
exports.useTexture = useTexture;
const usePictureAsTexture = (picture, size) => {
  const texture = _ReanimatedProxy.default.useSharedValue(null);
  (0, _react.useEffect)(() => {
    if (picture !== null) {
      _ReanimatedProxy.default.runOnUI(createTexture)(texture, picture, size);
    }
  }, [picture, size, texture]);
  return texture;
};
exports.usePictureAsTexture = usePictureAsTexture;
const useImageAsTexture = source => {
  const image = (0, _skia.useImage)(source);
  const texture = _ReanimatedProxy.default.useSharedValue(null);
  (0, _react.useEffect)(() => {
    if (image !== null) {
      _ReanimatedProxy.default.runOnUI(createTextureFromImage)(texture, image);
    }
  }, [image, texture]);
  return texture;
};
exports.useImageAsTexture = useImageAsTexture;
//# sourceMappingURL=textures.js.map