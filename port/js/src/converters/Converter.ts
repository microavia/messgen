import { Buffer } from "../Buffer";
import { IType, IValue } from "../types";

export abstract class Converter {
  protected name: IType

  constructor(name: IType) {
    this.name = name;
  }

  abstract serialize(value: IValue, buffer: Buffer): void;

  abstract deserialize(buffer: Buffer): IValue;

  abstract size(value: IValue): number;

  abstract default(): IValue
}
