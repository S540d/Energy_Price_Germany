import { Image, PixelRatio, Platform as RNPlatform, findNodeHandle, View } from "react-native";
import { isRNModule } from "../skia/types";
export const Platform = {
  OS: RNPlatform.OS,
  PixelRatio: PixelRatio.get(),
  resolveAsset: source => {
    // eslint-disable-next-line no-nested-ternary
    return isRNModule(source) ? Image.resolveAssetSource(source).uri : "uri" in source ? source.uri : source.default;
  },
  findNodeHandle,
  View
};
//# sourceMappingURL=Platform.js.map