"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useSVG = void 0;
var _react = require("react");
var _Skia = require("../Skia");
const useSVG = (source, onError) => {
  const [svg, setSVG] = (0, _react.useState)(null);
  if (source === null || source === undefined) {
    throw new Error(`Invalid svg data source. Got: ${source}`);
  }
  (0, _react.useEffect)(() => {
    (async () => {
      let src;
      if (typeof source === "string") {
        src = source;
      } else if (typeof source === "object" && "default" in source && typeof source.default === "string") {
        src = source.default;
      } else if (typeof source === "object" && "uri" in source) {
        src = source.uri;
      } else {
        throw new Error(`Invalid svg data source. Make sure that the source resolves to a string. Got: ${JSON.stringify(source, null, 2)}`);
      }
      const result = await fetch(src);
      const svgStr = await result.text();
      const newSvg = _Skia.Skia.SVG.MakeFromString(svgStr);
      setSVG(newSvg);
      if (newSvg === null && onError !== undefined) {
        onError(new Error("Failed to create SVG from source."));
      }
    })();
  }, [onError, source]);
  return svg;
};
exports.useSVG = useSVG;
//# sourceMappingURL=SVG.web.js.map