import type { Buffer } from '../../Buffer';
import type { IName, IValue, StructTypeDefinition } from '../../types';
import { Converter } from '../Converter';
import type { GetType } from '../ConverterFactory';

export class StructConverter extends Converter {
  convertorsList: { converter: Converter, name: string }[] = [];
  private static RESERVED_WORDS: Set<string> = new Set(Object.getOwnPropertyNames(Object.prototype));
  parentObject: Record<IName, IValue>;

  constructor(protocolName: string, typeDef: StructTypeDefinition, getType: GetType) {
    super(typeDef.typeName);
    const fieldsSet = new Set<string>();

    typeDef.fields?.forEach((field) => {
      if (fieldsSet.has(field.name)) {
        throw new Error(`Field ${field.name} is duplicated in ${this.name}`);
      }
      fieldsSet.add(field.name);

      if (StructConverter.RESERVED_WORDS.has(field.name)) {
        throw new Error(`Field ${field.name} is a reserved word in JavaScript`);
      }

      const converter = getType(protocolName, field.type);
      if (!converter) {
        throw new Error(`Converter for type ${field.type} is not found in ${this.name}`);
      }

      this.convertorsList.push({ converter, name: field.name });
    });

    this.parentObject = Object.fromEntries(
      this.convertorsList.map(({ name, converter }) => [name, converter.default()]),
    );
  }

  serialize(value: IValue, buffer: Buffer) {
    this.convertorsList.forEach(({ converter, name }) => {
      const data = value[name];
      if (data === null || data === undefined) {
        throw new Error(`Field ${name} is not found in ${this.name}`);
      }
      converter.serialize(data, buffer);
    });
  }

  deserialize(buffer: Buffer): IValue {
    return this.convertorsList.reduce((acc, { converter, name }) => {
      acc[name] = converter.deserialize(buffer);
      return acc;
    }, {} as Record<IName, IValue>);
  }

  size(value: IValue): number {
    return this.convertorsList.reduce((acc, { converter, name }) => {
      const data = value[name];
      if (data === null || data === undefined) {
        throw new Error(`Field ${name} is not found in ${this.name}`);
      }

      return acc + converter.size(data);
    }, 0);
  }

  default(): IValue {
    return this.parentObject;
  }
}
