import { Buffer } from "../Buffer";
import { IType, IValue, TypedArrayConstructor } from "../types";

export abstract class Converter {
  name: IType

  constructor(name: IType) {
    this.name = name;
  }

  serialize(value: IValue, buffer: Buffer) {
    throw new Error(`Not implemented in abstract class ${this.name} `);
  }

  size(value: IValue): number {
    throw new Error(`Not implemented in abstract class ${this.name} `);
  }

  deserialize(buffer: Buffer): IValue {
    throw new Error(`Not implemented in abstract class ${this.name} `);
  }

  default(): IValue {
    return null;
  }
}
