"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Platform = void 0;
var _reactNative = require("react-native");
var _types = require("../skia/types");
const Platform = exports.Platform = {
  OS: _reactNative.Platform.OS,
  PixelRatio: _reactNative.PixelRatio.get(),
  resolveAsset: source => {
    // eslint-disable-next-line no-nested-ternary
    return (0, _types.isRNModule)(source) ? _reactNative.Image.resolveAssetSource(source).uri : "uri" in source ? source.uri : source.default;
  },
  findNodeHandle: _reactNative.findNodeHandle,
  View: _reactNative.View
};
//# sourceMappingURL=Platform.js.map