import { Converter } from "./Converter";
import { IType, IPrimitiveType, IValue } from "./types";
import { Buffer } from "./Buffer";
import { parseType, ParseType } from "./utils/parseType";
import { ASSERT_EXHAUSTIVE } from "./utils/ASSERT_EXHAUSTIVE";

export const DYNAMIC_SIZE_TYPE: IPrimitiveType = "uint32";

export class NestedConverter extends Converter {
  private types: ParseType;
  private dynConverter: Converter;
  
  constructor(
    name: IType,
    private converters: Map<IType, Converter>
  ) {
    super(name);
    const dynConverter = converters.get(DYNAMIC_SIZE_TYPE)
    if (!dynConverter) {
      throw new Error(`Converter for type ${DYNAMIC_SIZE_TYPE} is not found in ${name}`);
    }
    this.dynConverter = dynConverter
    this.types = parseType(name, converters);
  }
  
  serialize(value: any, buffer: Buffer) {
    this._serialize(value, buffer, this.types.wrapper.length - 1);
  }
  
  private _serialize(value: any, buffer: Buffer, offsetWrapper: number) {
    if (offsetWrapper < 0) {
      this.types.converter.serialize(value, buffer);
      return;
    }
    
    let currentType = this.types.wrapper[offsetWrapper];
    switch (currentType.variant) {
      case "array":
        let arrayLength
        
        if (currentType.length === undefined) {
          arrayLength = value.length;
          this.dynConverter.serialize(arrayLength, buffer);
        } else {
          arrayLength = currentType.length;
        }
        
        for (let i = 0; i < arrayLength; i++) {
          this._serialize(value[i], buffer, offsetWrapper - 1);
        }
        break;
      case "map":
        throw new Error("Not implemented");
      default:
        ASSERT_EXHAUSTIVE(currentType)
    }
  }
  
  deserialize(buffer: Buffer): any {
    return this._deserialize(buffer, this.types.wrapper.length - 1);
  }
  
  private _deserialize(buffer: Buffer, offsetWrapper: number): any {
    
    if (offsetWrapper < 0) {
      return this.types.converter.deserialize(buffer);
    }
    
    let currentType = this.types.wrapper[offsetWrapper];
    switch (currentType.variant) {
      case "array":
        let arrayLength
        
        if (currentType.length === undefined) {
          arrayLength = this.dynConverter.deserialize(buffer);
        } else {
          arrayLength = currentType.length;
        }
        
        let result = new Array(arrayLength);
        for (let i = 0; i < arrayLength; i++) {
          result[i] = this._deserialize(buffer, offsetWrapper - 1);
        }
        return result;
      case "map":
        throw new Error("Not implemented");
      default:
        ASSERT_EXHAUSTIVE(currentType)
    }
  }
  
  size(value: IValue): number {
    console.log(`:: this.types.wrapper =`, this.types.wrapper);
    return this._size(value, this.types.wrapper.length - 1);
  }
  
  private _size(value: IValue, offsetWrapper: number): number {
    if (offsetWrapper < 0) {
      return this.types.converter.size(value);
    }
    
    let currentType = this.types.wrapper[offsetWrapper];
    switch (currentType.variant) {
      case "array":
        let arrayLengthSize = 0
        
        if (currentType.length === undefined) {
          arrayLengthSize = this.dynConverter.size(value.length)
        }
        
        return arrayLengthSize + value.reduce((acc: number, v: IValue) => acc + this._size(v, offsetWrapper - 1), 0);
      
      case "map":
        throw new Error("Not implemented");
      default:
        ASSERT_EXHAUSTIVE(currentType)
        return 0;
    }
  }
}
