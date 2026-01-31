import { CommandType, isGroup } from "./Core";
const CommandTypeNames = {
  [CommandType.Group]: "Group",
  [CommandType.SavePaint]: "SavePaint",
  [CommandType.RestorePaint]: "RestorePaint",
  [CommandType.SaveCTM]: "SaveCTM",
  [CommandType.RestoreCTM]: "RestoreCTM",
  [CommandType.PushColorFilter]: "PushColorFilter",
  [CommandType.PushBlurMaskFilter]: "PushBlurMaskFilter",
  [CommandType.PushImageFilter]: "PushImageFilter",
  [CommandType.PushPathEffect]: "PushPathEffect",
  [CommandType.PushShader]: "PushShader",
  [CommandType.ComposeColorFilter]: "ComposeColorFilter",
  [CommandType.ComposeImageFilter]: "ComposeImageFilter",
  [CommandType.ComposePathEffect]: "ComposePathEffect",
  [CommandType.MaterializePaint]: "MaterializePaint",
  [CommandType.SaveBackdropFilter]: "SaveBackdropFilter",
  [CommandType.SaveLayer]: "SaveLayer",
  [CommandType.RestorePaintDeclaration]: "RestorePaintDeclaration",
  [CommandType.DrawBox]: "DrawBox",
  [CommandType.DrawImage]: "DrawImage",
  [CommandType.DrawCircle]: "DrawCircle",
  [CommandType.DrawPaint]: "DrawPaint",
  [CommandType.DrawPoints]: "DrawPoints",
  [CommandType.DrawPath]: "DrawPath",
  [CommandType.DrawRect]: "DrawRect",
  [CommandType.DrawRRect]: "DrawRRect",
  [CommandType.DrawOval]: "DrawOval",
  [CommandType.DrawLine]: "DrawLine",
  [CommandType.DrawPatch]: "DrawPatch",
  [CommandType.DrawVertices]: "DrawVertices",
  [CommandType.DrawDiffRect]: "DrawDiffRect",
  [CommandType.DrawText]: "DrawText",
  [CommandType.DrawTextPath]: "DrawTextPath",
  [CommandType.DrawTextBlob]: "DrawTextBlob",
  [CommandType.DrawGlyphs]: "DrawGlyphs",
  [CommandType.DrawPicture]: "DrawPicture",
  [CommandType.DrawImageSVG]: "DrawImageSVG",
  [CommandType.DrawParagraph]: "DrawParagraph",
  [CommandType.DrawAtlas]: "DrawAtlas",
  [CommandType.DrawSkottie]: "DrawSkottie"
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
export const debugTree = (commands, indent = 0) => {
  let result = "[\n";
  const prefix = " ".repeat(indent + 2);
  commands.forEach((cmd, index) => {
    const type = CommandTypeNames[cmd.type] || "Unknown";
    result += `${prefix}{ "type": "${type}"`;
    if ("props" in cmd) {
      result += `, "props": ${serializeProps(cmd.props)}`;
    }
    if (isGroup(cmd)) {
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
//# sourceMappingURL=Debug.js.map