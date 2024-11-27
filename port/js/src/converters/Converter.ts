import type { Buffer } from '../Buffer';
import type { IType, IValue } from '../types';

export abstract class Converter {
  name: IType;

  constructor(name: IType) {
    this.name = name;
  }

  serialize(_value: IValue, _buffer: Buffer) {
    throw new Error(`Not implemented in abstract class ${this.name} `);
  }

  size(_value: IValue): number {
    throw new Error(`Not implemented in abstract class ${this.name} `);
  }

  deserialize(_buffer: Buffer): IValue {
    throw new Error(`Not implemented in abstract class ${this.name} `);
  }

  default(): IValue {
    return null;
  }
}
