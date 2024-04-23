import { Converter } from "./Converter";
import { IType, EnumTypeClass, IValue } from "../types";
import { Buffer } from "../Buffer";


export class EnumConverter extends Converter {
  private converter: Converter;
  
  constructor(
    name: string,
    private types: EnumTypeClass,
    private converters: Map<IType, Converter>
  ) {
    super(name);
    
    let converter = converters.get(types.base_type);
    if (!converter) {
      throw new Error(`Converter for type ${types.base_type} is not found in ${name}`);
    }
    this.converter = converter;
    
  }
  
  serialize(value: IValue, buffer: Buffer) {
    this.converter.serialize(value, buffer);
  }
  
  deserialize(buffer: Buffer) {
    return this.converter.deserialize(buffer);
  }
  
  size(value: IValue) {
    return this.converter.size(value);
  }
}
