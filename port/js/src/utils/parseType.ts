import { IType, IBasicType, IName } from "../types";
import { Converter } from "../converters/Converter";

export type ParseArrayType =
  {
    variant: 'array'
    length: number | undefined
  }

export type ParseTypedArrayType =
  {
    variant: 'typed-array'
    length: number | undefined
    TypedArray: Int8ArrayConstructor | Uint8ArrayConstructor | Int16ArrayConstructor | Uint16ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor | BigInt64ArrayConstructor | BigUint64ArrayConstructor | Float32ArrayConstructor | Float64ArrayConstructor;
    
  }

export type ParseMapType =
  {
    variant: 'map'
    converter: Converter
  }

export type ParseType =
  {
    converter: Converter
    wrapper: Array<ParseArrayType | ParseMapType | ParseTypedArrayType>
  }

/**
 * The parseType function is used to parse a type string and convert it into a structured object representation. It takes a type string and a map of converters as inputs and returns a ParseType object.
 * Example Usage
 * const typeStr = 'int32[5]{int32}';
 * const converters = new Map<IType, Converter>();
 * const result = parseType(typeStr, converters);
 * console.log(result);
 * // Output: { converters: Converter, wrapper: [ { variant: 'array', length: 5 }, { variant: 'map', converters: Converter } ] }
 * Code Analysis
 * Inputs
 * typeStr (string): The type string to be parsed.
 * converters (Map<IType, Converter>): A map of converters used to convert the basis type and key type of the type string.
 *
 * Flow
 * Split the type string into parts using regular expressions to identify array and map notations.
 * Extract the basis type from the first part of the type string.
 * Iterate over the remaining parts of the type string.
 * If a part ends with ']', add an ParseArrayType object to the wrapper array with the length extracted from the part.
 * If a part ends with '}', extract the key type and add a ParseMapType object to the wrapper array with the corresponding converters.
 * Get the converters for the basis type from the converters map.
 * Return a ParseType object with the converters and the wrapper array.
 *
 * Outputs
 * ParseType object: An object containing the converters for the basis type and an array of ParseArrayType and ParseMapType objects representing the array and map notations in the type string.
 *
 * @param typeStr
 * @param converters
 */
export function parseType(typeStr: IType, converters: Map<IType, Converter>): ParseType {
  let wrapper: Array<ParseArrayType | ParseMapType | ParseTypedArrayType> = [];
  let basisType: IBasicType | IName;
  let typeParts = typeStr.split(
    /[\[\{]/ig
  );
  
  
  basisType = typeParts[0] as IBasicType | IName;
  
  let converter = converters.get(basisType);
  if (!converter) {
    throw new Error(`Unknown type: ${basisType}, if is complex type you must define before the struct. `)
  }
  
  for (let i = 1; i < typeParts.length; i++) {
    let item = typeParts[i];
    let keyType: IBasicType | undefined;
    
    if (item.includes(']')) {
      let lengthStr = item.slice(0, -1);
      if (i === 1 && converter.typedArray) {
        wrapper.push({
          variant: 'typed-array',
          length: lengthStr ? parseInt(lengthStr) : undefined,
          TypedArray: converter.typedArray
        });
      } else {
        wrapper.push({
          variant: 'array',
          length: lengthStr ? parseInt(lengthStr) : undefined
        });
      }
      
    } else if (item.includes('}')) {
      keyType = item.slice(0, -1) as IBasicType;
      if (keyType === undefined) {
        throw new Error(`Invalid map key type: ${item}`);
      }
      
      let keyConverter = converters.get(keyType);
      if (!keyConverter) {
        throw new Error(`Unknown type: ${keyType}, if is complex type you must define before the struct. `)
      }
      wrapper.push({
        variant: 'map',
        converter: keyConverter
      });
    }
  }
  
  return {
    converter: converter,
    wrapper: wrapper
  }
  
}
