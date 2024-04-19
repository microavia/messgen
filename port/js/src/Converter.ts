import { Buffer } from "./Buffer";
import { IType } from "./types";

export abstract class Converter {
  name: IType
  
  constructor(name: IType) {
    this.name = name;
  }
  
  serialize(value: any, buffer: Buffer) { // modify buffer.offset
    throw new Error(`Not implemented in abstract class ${this.name} `);
  }
  
  size(value: any): number {
    throw new Error(`Not implemented in abstract class ${this.name} `);
  }
  
  deserialize(buffer: Buffer): any {// modify buffer.offset.offset
    throw new Error(`Not implemented in abstract class ${this.name} `);
  }
}
