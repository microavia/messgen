import { IBasicType, IType, IValue } from "../types";
import { parseType } from "../utils/parseType";
import { ArrayConverter } from "./ArrayConverter";
import { Converter } from "./Converter";
import { MapConverter } from "./MapConverter";
import { TypedArrayConverter } from "./TypedArrayConverter";
import { Buffer } from "../Buffer";

export const DYNAMIC_SIZE_TYPE: IBasicType = "uint32";

export class NestedConverter extends Converter {
  private finalConverter: Converter;

  constructor(name: IType, converters: Map<IType, Converter>) {
    super(name);
    const dynamicConverter = converters.get(DYNAMIC_SIZE_TYPE);
    if (!dynamicConverter) {
      throw new Error(`Required dynamic size converter (${DYNAMIC_SIZE_TYPE}) not found for ${name}`);
    }

    const parsedType = parseType(name, converters);

    let currentConverter = parsedType.converter;

    for (const wrapper of parsedType.wrapper) {
      switch (wrapper.variant) {
        case "typed-array": {
          currentConverter = new TypedArrayConverter(
            name,
            currentConverter,
            dynamicConverter,
            wrapper.TypedArray,
            wrapper.length
          );
          break;
        }
        case "array": {
          currentConverter = new ArrayConverter(
            name,
            currentConverter,
            dynamicConverter,
            wrapper.length
          );
          break;
        }
        case "map": {
          currentConverter = new MapConverter(
            name,
            wrapper.converter,
            currentConverter,
            dynamicConverter
          );
          break;
        }
      }
    }

    this.finalConverter = currentConverter;
  }

  serialize(value: IValue, buffer: Buffer): void {
    this.finalConverter.serialize(value, buffer);
  }

  deserialize(buffer: Buffer): IValue {
    return this.finalConverter.deserialize(buffer);
  }

  size(value: IValue): number {
    return this.finalConverter.size(value);
  }
}
