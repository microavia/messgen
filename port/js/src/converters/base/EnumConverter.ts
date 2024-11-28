import { Converter } from '../Converter';
import type { IValue, EnumTypeDefinition } from '../../types';
import type { Buffer } from '../../Buffer';
import type { GetType } from './../ConverterFactory';

export class EnumConverter extends Converter {
  private converter: Converter;
  private enumsByName: Record<string, number>;
  private enumsByValue: string[];

  constructor(protocolName: string, typeDef: EnumTypeDefinition, getType: GetType) {
    super(typeDef.typeName);

    this.converter = getType(protocolName, typeDef.type);

    this.enumsByName = typeDef.values.reduce((acc, value) => {
      acc[value.name] = value.value;
      return acc;
    }, {} as Record<string, number>);

    this.enumsByValue = typeDef.values.reduce((acc, value) => {
      acc[value.value] = value.name;
      return acc;
    }, [] as string[]);
  }

  serialize(value: IValue, buffer: Buffer) {
    this.converter.serialize(this.enumsByName[value] ?? value, buffer);
  }

  deserialize(buffer: Buffer) {
    return this.converter.deserialize(buffer);
  }

  size(value: IValue) {
    return this.converter.size(value);
  }

  default() {
    return this.enumsByValue[0];
  }
}
