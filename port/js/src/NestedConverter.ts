import { Converter } from "./Converter";
import { IType, IPrimitiveType, IValue } from "./types";
import { Buffer } from "./Buffer";
import { parseType, ParseType } from "./utils/parseType";
import { ASSERT_EXHAUSTIVE } from "./utils/ASSERT_EXHAUSTIVE";

export let DYNAMIC_SIZE_TYPE: IPrimitiveType = "uint32";

export class NestedConverter extends Converter {
  private types: ParseType;
  private dynConverter: Converter;
  
  constructor(
    name: IType,
    private converters: Map<IType, Converter>
  ) {
    super(name);
    let dynConverter = converters.get(DYNAMIC_SIZE_TYPE)
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
        // is map
        if ((value instanceof Map)) {
          let map: Map<IPrimitiveType, IValue> = value
          this.dynConverter.serialize(map.size, buffer)
          
          map.forEach((v, k) => {
            currentType.converter.serialize(k, buffer)
            this._serialize(v, buffer, offsetWrapper - 1)
          })
          // is object
        } else if (value instanceof Object) {
          let entries = Object.entries(value)
          this.dynConverter.serialize(entries.length, buffer)
          entries.forEach((entry) => {
            let k = entry[0]
            let v = entry[1]
            currentType.converter.serialize(k, buffer)
            this._serialize(v, buffer, offsetWrapper - 1)
          })
          
        } else {
          throw new Error(`Value is not an object or Map: ${value}`)
        }
        break;
      
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
        let mapSize = this.dynConverter.deserialize(buffer)
        let map = new Map<IPrimitiveType, IValue>()
        for (let i = 0; i < mapSize; i++) {
          let key = currentType.converter.deserialize(buffer)
          let value = this._deserialize(buffer, offsetWrapper - 1)
          map.set(key, value)
        }
        return map;
      default:
        ASSERT_EXHAUSTIVE(currentType)
    }
  }
  
  size(value: IValue): number {
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
        } else {
          if (value.length !== currentType.length) {
            throw new Error(`Array length mismatch: ${value.length} !== ${currentType.length}`)
          }
        }
        
        return arrayLengthSize + value.reduce((acc: number, v: IValue) => acc + this._size(v, offsetWrapper - 1), 0);
      
      case "map":
        let mapSizeSize = this.dynConverter.size(value.size)
        if (value instanceof Map) {
          let map: Map<IPrimitiveType, IValue> = value
          
          let mapSize = mapSizeSize
          map.forEach((v, k) => {
            mapSize += currentType.converter.size(k) + this._size(v, offsetWrapper - 1)
          })
          
          return mapSize;
        } else if (value instanceof Object) {
          let entries = Object.entries(value) as [IPrimitiveType, IValue][]
          let mapSize = mapSizeSize
          entries.forEach((entry) => {
            let k = entry[0]
            let v: IValue = entry[1]
            mapSize += currentType.converter.size(k) + this._size(v, offsetWrapper - 1)
          })
          
          return mapSize;
        }
        throw new Error(`Value is not an object or Map: ${value}`)
      
      default:
        ASSERT_EXHAUSTIVE(currentType)
        return 0;
    }
  }
}
