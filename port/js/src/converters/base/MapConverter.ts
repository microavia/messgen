import type { IValue, MapTypeDefinition } from '../../types';
import { Converter } from '../Converter';
import type { Buffer } from '../../Buffer';
import type { GetType } from '../ConverterFactory';
import { SIZE_TYPE } from '../../config';

export class MapConverter extends Converter {
  protected keyConverter: Converter;
  protected valueConverter: Converter;
  protected dynamicSizeConverter: Converter;

  constructor(typeDef: MapTypeDefinition, getType: GetType) {
    super(typeDef.typeClass);
    this.keyConverter = getType(typeDef.keyType);
    this.valueConverter = getType(typeDef.valueType);
    this.dynamicSizeConverter = getType(SIZE_TYPE);
  }

  serialize(value: Map<IValue, IValue> | Record<string, IValue>, buffer: Buffer): void {
    const entries = value instanceof Map ? Array.from(value.entries()) : Object.entries(value);
    this.dynamicSizeConverter.serialize(entries.length, buffer);

    for (const [key, val] of entries) {
      this.keyConverter.serialize(key, buffer);
      this.valueConverter.serialize(val, buffer);
    }
  }

  deserialize(buffer: Buffer): Map<IValue, IValue> {
    const size = this.dynamicSizeConverter.deserialize(buffer);
    const result = new Map<IValue, IValue>();

    for (let i = 0; i < size; i++) {
      const key = this.keyConverter.deserialize(buffer);
      const value = this.valueConverter.deserialize(buffer);
      result.set(key, value);
    }

    return result;
  }

  size(value: Map<IValue, IValue> | Record<string, IValue>): number {
    const entries = value instanceof Map ? Array.from(value.entries()) : Object.entries(value);
    let totalSize = this.dynamicSizeConverter.size(entries.length);

    for (const [key, val] of entries) {
      totalSize += this.keyConverter.size(key);
      totalSize += this.valueConverter.size(val);
    }

    return totalSize;
  }

  default(): Map<IValue, IValue> {
    return new Map();
  }
}
