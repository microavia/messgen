import { typeIndex, typeSize } from "./constants";
import { Messages } from "./types";
import { Struct } from "./Struct";

export type ParseType = {
  struct?: Struct
  typeIndex: number | Struct
  typeSize: number
  length: number
  isArray: boolean
  isComplex: boolean
}

export function parseType(typeStr: string, includeMessages: Messages<string>): ParseType {
  
  let a = typeStr.split('['),
    name = a[0].trim();
  
  let size, isComplex = false;
  let struct
  let type: Struct | number = typeIndex[name];
  
  if (type != undefined) {
    size = typeSize[type];
  } else if (includeMessages && includeMessages[name]) {
    type = includeMessages[name];
    struct = includeMessages[name];
    size = type.size;
    isComplex = true;
  } else {
    throw new Error(`Unknown type: ${name}, if is complex type you must define before the struct. `);
  }
  
  let length = parseInt(a[1]);
  
  return {
    struct,
    typeIndex: type,
    typeSize: size,
    length: isNaN(length) ? 0 : length,
    isArray: a.length === 2,
    isComplex: isComplex
  };
}
