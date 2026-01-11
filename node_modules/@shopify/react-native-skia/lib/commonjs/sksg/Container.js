"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createContainer = void 0;
var _StaticContainer = require("./StaticContainer");
const createContainer = (Skia, nativeId) => {
  return new _StaticContainer.StaticContainer(Skia, nativeId);
};
exports.createContainer = createContainer;
//# sourceMappingURL=Container.js.map