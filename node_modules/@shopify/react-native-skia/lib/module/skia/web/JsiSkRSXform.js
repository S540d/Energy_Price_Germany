import { BaseHostObject } from "./Host";
export class JsiSkRSXform extends BaseHostObject {
  static fromValue(rsxform) {
    if (rsxform instanceof JsiSkRSXform) {
      return rsxform.ref;
    }
    return Float32Array.of(rsxform.scos, rsxform.ssin, rsxform.tx, rsxform.ty);
  }
  constructor(CanvasKit, ref) {
    super(CanvasKit, ref, "RSXform");
  }
  set(scos, ssin, tx, ty) {
    this.ref[0] = scos;
    this.ref[1] = ssin;
    this.ref[2] = tx;
    this.ref[3] = ty;
  }
  get scos() {
    return this.ref[0];
  }
  get ssin() {
    return this.ref[1];
  }
  get tx() {
    return this.ref[2];
  }
  get ty() {
    return this.ref[3];
  }
}
//# sourceMappingURL=JsiSkRSXform.js.map