"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.debugTree = void 0;
var _Core = require("./Core");
const CommandTypeNames = {
  [_Core.CommandType.Group]: "Group",
  [_Core.CommandType.SavePaint]: "SavePaint",
  [_Core.CommandType.RestorePaint]: "RestorePaint",
  [_Core.CommandType.SaveCTM]: "SaveCTM",
  [_Core.CommandType.RestoreCTM]: "RestoreCTM",
  [_Core.CommandType.PushColorFilter]: "PushColorFilter",
  [_Core.CommandType.PushBlurMaskFilter]: "PushBlurMaskFilter",
  [_Core.CommandType.PushImageFilter]: "PushImageFilter",
  [_Core.CommandType.PushPathEffect]: "PushPathEffect",
  [_Core.CommandType.PushShader]: "PushShader",
  [_Core.CommandType.ComposeColorFilter]: "ComposeColorFilter",
  [_Core.CommandType.ComposeImageFilter]: "ComposeImageFilter",
  [_Core.CommandType.ComposePathEffect]: "ComposePathEffect",
  [_Core.CommandType.MaterializePaint]: "MaterializePaint",
  [_Core.CommandType.SaveBackdropFilter]: "SaveBackdropFilter",
  [_Core.CommandType.SaveLayer]: "SaveLayer",
  [_Core.CommandType.RestorePaintDeclaration]: "RestorePaintDeclaration",
  [_Core.CommandType.DrawBox]: "DrawBox",
  [_Core.CommandType.DrawImage]: "DrawImage",
  [_Core.CommandType.DrawCircle]: "DrawCircle",
  [_Core.CommandType.DrawPaint]: "DrawPaint",
  [_Core.CommandType.DrawPoints]: "DrawPoints",
  [_Core.CommandType.DrawPath]: "DrawPath",
  [_Core.CommandType.DrawRect]: "DrawRect",
  [_Core.CommandType.DrawRRect]: "DrawRRect",
  [_Core.CommandType.DrawOval]: "DrawOval",
  [_Core.CommandType.DrawLine]: "DrawLine",
  [_Core.CommandType.DrawPatch]: "DrawPatch",
  [_Core.CommandType.DrawVertices]: "DrawVertices",
  [_Core.CommandType.DrawDiffRect]: "DrawDiffRect",
  [_Core.CommandType.DrawText]: "DrawText",
  [_Core.CommandType.DrawTextPath]: "DrawTextPath",
  [_Core.CommandType.DrawTextBlob]: "DrawTextBlob",
  [_Core.CommandType.DrawGlyphs]: "DrawGlyphs",
  [_Core.CommandType.DrawPicture]: "DrawPicture",
  [_Core.CommandType.DrawImageSVG]: "DrawImageSVG",
  [_Core.CommandType.DrawParagraph]: "DrawParagraph",
  [_Core.CommandType.DrawAtlas]: "DrawAtlas",
  [_Core.CommandType.DrawSkottie]: "DrawSkottie"
};
const serializeProps = props => {
  try {
    return JSON.stringify(props, (key, value) => {
      if (key === "children") {
        return undefined;
      }
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    });
  } catch (e) {
    return `"Error serializing props: ${e}"`;
  }
};
const debugTree = (commands, indent = 0) => {
  let result = "[\n";
  const prefix = " ".repeat(indent + 2);
  commands.forEach((cmd, index) => {
    const type = CommandTypeNames[cmd.type] || "Unknown";
    result += `${prefix}{ "type": "${type}"`;
    if ("props" in cmd) {
      result += `, "props": ${serializeProps(cmd.props)}`;
    }
    if ((0, _Core.isGroup)(cmd)) {
      result += `, "children": ${debugTree(cmd.children, indent + 2)}`;
    }
    result += " }";
    if (index < commands.length - 1) {
      result += ",";
    }
    result += "\n";
  });
  result += " ".repeat(indent) + "]";
  return result;
};
exports.debugTree = debugTree;
//# sourceMappingURL=Debug.js.map