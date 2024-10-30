import { Messages, IType, IPrimitiveType, IName } from "./types";
import { Struct } from "./Struct";
import { typeSize, typeIndex } from "./constants";

export type ParseArrayType =
  {
    variant: 'array'
    length: number | undefined
  }

export type ParseMapType =
  {
    variant: 'map'
    keyType: IPrimitiveType | 'string' | undefined
    keyTypeSize: number
  }


export type ParsePrimitiveType = {
  variant: 'primitive'
  typeIndex: number
  typeSize: number
  wrapper: Array<ParseArrayType | ParseMapType>
}

export type ParseComplexType =
  {
    variant: 'complex'
    struct: Struct
    typeSize: number
    wrapper: Array<ParseArrayType | ParseMapType>
  }

export function parseType(typeStr: IType, includeMessages: Messages<string>): ParsePrimitiveType | ParseComplexType {
  let wrapper: Array<ParseArrayType | ParseMapType> = [];
  let basisType: IPrimitiveType | IName;
  let typeParts = typeStr.split(
    /[\[\{]/ig
  );
  
  basisType = typeParts[0] as IPrimitiveType | IName;
  for (let i = 1; i < typeParts.length; i++) {
    let item = typeParts[i];
    let keyType: IPrimitiveType | undefined;
    
    if (item.includes(']')) {
      let lengthStr = item.slice(0, -1);
    let le
      wrapper.push({ variant: 'array', length: lengthStr ? parseInt(lengthStr) : undefined });
    }
    
    if (item.includes('}')) {
      keyType = item.slice(0, -1) as IPrimitiveType;
      if (keyType === undefined) {
        throw new Error(`Invalid map key type: ${item}`);
      }
      let keyTypeIndex = typeIndex[keyType]
      if (keyTypeIndex === undefined) {
        throw new Error(`Unknown type: ${keyType}, if is complex type you must define before the struct. `)
      }
      wrapper.push({
        variant: 'map',
        keyType: keyType,
        keyTypeSize: typeSize[keyTypeIndex]
      });
    }
  }
  
  let type = typeIndex[basisType]
  
  if (type !== undefined) {
    return {
      variant: 'primitive',
      typeIndex: type,
      typeSize: typeSize[type],
      wrapper
    }
    
  } else if (includeMessages) {
    
    let struct = includeMessages.__messages__[basisType];
    if (!struct) {
      throw new Error(`Unknown type: ${basisType}, if is complex type you must define before the struct.`)
    }
    return {
      variant: 'complex',
      struct,
      typeSize: struct.size,
      wrapper
    }
  } else {
    throw new Error(`Unknown type: ${basisType}, if is complex type you must define before the struct. `)
  }
}
