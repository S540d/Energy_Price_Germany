import { useEffect, useState } from "react";
import { drawAsPicture } from "../../renderer/Offscreen";
import { Skia, useImage } from "../../skia";
import { Platform } from "../../Platform";
import Rea from "./ReanimatedProxy";
const createTextureFromImage = (texture, image) => {
  "worklet";

  const surface = Skia.Surface.MakeOffscreen(image.width(), image.height());
  if (!surface) {
    texture.value = null;
    return;
  }
  const canvas = surface.getCanvas();
  canvas.drawImage(image, 0, 0);
  surface.flush();
  texture.value = surface.makeImageSnapshot();
  if (Platform.OS === "web") {
    texture.value = texture.value.makeNonTextureImage();
  }
};
const createTexture = (texture, picture, size) => {
  "worklet";

  const surface = Skia.Surface.MakeOffscreen(size.width, size.height);
  const canvas = surface.getCanvas();
  canvas.drawPicture(picture);
  surface.flush();
  texture.value = surface.makeImageSnapshot();
  if (Platform.OS === "web") {
    texture.value = texture.value.makeNonTextureImage();
  }
};
export const useTexture = (element, size, deps) => {
  const {
    width,
    height
  } = size;
  const [picture, setPicture] = useState(null);
  useEffect(() => {
    drawAsPicture(element, {
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
export const usePictureAsTexture = (picture, size) => {
  const texture = Rea.useSharedValue(null);
  useEffect(() => {
    if (picture !== null) {
      Rea.runOnUI(createTexture)(texture, picture, size);
    }
  }, [picture, size, texture]);
  return texture;
};
export const useImageAsTexture = source => {
  const image = useImage(source);
  const texture = Rea.useSharedValue(null);
  useEffect(() => {
    if (image !== null) {
      Rea.runOnUI(createTextureFromImage)(texture, image);
    }
  }, [image, texture]);
  return texture;
};
//# sourceMappingURL=textures.js.map