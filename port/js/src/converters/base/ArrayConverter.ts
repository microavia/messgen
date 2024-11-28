import type { Buffer } from '../../Buffer';
import { SIZE_TYPE } from '../../config';
import type { ArrayTypeDefinition, IValue } from '../../types';
import { Converter } from '../Converter';
import type { GetType } from '../ConverterFactory';

export class ArrayConverter extends Converter {
  private converter: Converter;
  private sizeConverter: Converter;
  private arraySize?: number;

  constructor(protocolName: string, typeDef: ArrayTypeDefinition, getType: GetType) {
    super(typeDef.type + typeDef.elementType);
    this.converter = getType(protocolName, typeDef.elementType);
    this.sizeConverter = getType(protocolName, SIZE_TYPE);
    this.arraySize = typeDef.arraySize;
  }

  serialize(value: Array<IValue>, buffer: Buffer): void {
    const { length } = value;
    if (this.arraySize !== undefined && length !== this.arraySize) {
      throw new Error(`Array length mismatch: ${length} !== ${this.arraySize}`);
    }

    if (this.arraySize === undefined) {
      this.sizeConverter.serialize(length, buffer);
    }

    for (let i = 0; i < length; i++) {
      this.converter.serialize(value[i], buffer);
    }
  }

  deserialize(buffer: Buffer): Array<IValue> {
    const length = this.arraySize ?? this.sizeConverter.deserialize(buffer);
    const result = [];

    for (let i = 0; i < length; i++) {
      result[i] = this.converter.deserialize(buffer);
    }

    return result;
  }

  size(value: Array<IValue>): number {
    const arraySize = value.length;
    if (this.arraySize !== undefined && arraySize !== this.arraySize) {
      throw new Error(`Array length mismatch: ${arraySize} !== ${this.arraySize}`);
    }

    const size = this.arraySize === undefined ? this.sizeConverter.size(arraySize) : 0;

    return size + value.reduce((acc, item) => acc + this.converter.size(item), 0);
  }

  default(): Array<IValue> {
    return [];
  }
}
