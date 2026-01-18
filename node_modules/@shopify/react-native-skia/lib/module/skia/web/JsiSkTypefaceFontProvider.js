import { HostObject, throwNotImplementedOnRNWeb } from "./Host";
export class JsiSkTypefaceFontProvider extends HostObject {
  constructor(CanvasKit, ref) {
    super(CanvasKit, ref, "FontMgr");
  }
  matchFamilyStyle(_name, _style) {
    return throwNotImplementedOnRNWeb();
  }
  countFamilies() {
    return this.ref.countFamilies();
  }
  getFamilyName(index) {
    return this.ref.getFamilyName(index);
  }
  registerFont(typeface, familyName) {
    const strLen = lengthBytesUTF8(familyName) + 1;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const strPtr = this.CanvasKit._malloc(strLen);
    stringToUTF8(this.CanvasKit, familyName, strPtr, strLen);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.ref._registerFont(typeface.ref, strPtr);
  }
}
const lengthBytesUTF8 = str => {
  // TextEncoder will give us the byte length in UTF8 form
  const encoder = new TextEncoder();
  const utf8 = encoder.encode(str);
  return utf8.length;
};
const stringToUTF8 = (CanvasKit, str, outPtr, maxBytesToWrite) => {
  // TextEncoder will give us the byte array in UTF8 form
  const encoder = new TextEncoder();
  const utf8 = encoder.encode(str);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const heap = CanvasKit.HEAPU8;

  // Check if there's enough space
  if (utf8.length > maxBytesToWrite) {
    throw new Error("Not enough space to write UTF8 encoded string");
  }

  // Copy the bytes
  for (let i = 0; i < utf8.length; i++) {
    heap[outPtr + i] = utf8[i];
  }

  // Null terminate
  if (utf8.length < maxBytesToWrite) {
    heap[outPtr + utf8.length] = 0;
  }
};
//# sourceMappingURL=JsiSkTypefaceFontProvider.js.map