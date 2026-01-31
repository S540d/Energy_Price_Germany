import { Skia } from "../skia";
import { Platform } from "../Platform";
import { SkiaSGRoot } from "../sksg/Reconciler";
export const isOnMainThread = () => {
  "worklet";

  return typeof _WORKLET !== "undefined" && _WORKLET === true || Platform.OS === "web";
};
export const drawAsPicture = async (element, bounds) => {
  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(bounds);
  const root = new SkiaSGRoot(Skia);
  await root.render(element);
  root.drawOnCanvas(canvas);
  const picture = recorder.finishRecordingAsPicture();
  root.unmount();
  return picture;
};
export const drawAsImage = async (element, size) => {
  return drawAsImageFromPicture(await drawAsPicture(element), size);
};
export const drawAsImageFromPicture = (picture, size) => {
  "worklet";

  const surface = Skia.Surface.MakeOffscreen(size.width, size.height);
  const canvas = surface.getCanvas();
  canvas.drawPicture(picture);
  surface.flush();
  const image = surface.makeImageSnapshot();
  return image.makeNonTextureImage();
};
//# sourceMappingURL=Offscreen.js.map