import { Converter } from "./Converter";
import { IType } from "./types";
import { Buffer } from "./Buffer";

export class NestedConverter extends Converter {
  constructor(
    name: IType,
    private converters: Map<IType, Converter>
  ) {
    super(name);
    
  }
  
  serialize(value: any, buffer: Buffer) {
  
  }
  
  deserialize(buffer: Buffer): any {
  }
  
  size(value: any): number {
  }
}
