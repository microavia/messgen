import { Converter } from "./Converter";
import { BasicTypesConfig, IPrimitiveType, IValue } from "./types";
import { Buffer } from "./Buffer";
import { basicTypes } from "./constants";


export class PrimitiveConverter extends Converter {
  constructor(private config: BasicTypesConfig) {
    super(config.name);
    
  }
  
  serialize(value: IValue, buffer: Buffer) {
    const size = this.config.write(buffer.dataView, buffer.offset, value);
    buffer.offset += size;
  }
  
  size(value: IValue): number {
    return this.config.size(value)
  }
  
  deserialize(buffer: Buffer): IValue {
    let result = this.config.read(buffer.dataView, buffer.offset);
    buffer.offset += this.config.size(result);
    return result;
  }
  
  static fromGlobalConfigs(): Record<IPrimitiveType, Converter> {
    return basicTypes.reduce((acc, config) => {
      acc[config.name] = new PrimitiveConverter(config);
      return acc;
    }, {} as Record<IPrimitiveType, Converter>)
  }
}
