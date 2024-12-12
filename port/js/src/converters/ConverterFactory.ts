import type { Converter } from './Converter';
import { Protocols } from '../protocol/Protocols';
import {
  ScalarConverter,
  StructConverter,
  ArrayConverter,
  TypedArrayConverter,
  MapConverter,
  EnumConverter,
} from './base';

export class ConverterFactory {
  constructor(private protocols: Protocols = new Protocols()) {
  }

  toConverter(typeName: string): Converter {
    const typeDef = this.protocols.getType(typeName);
    const getType = this.toConverter.bind(this);

    switch (typeDef.typeClass) {
      case 'scalar':
        return new ScalarConverter(typeDef.type);
      case 'enum':
        return new EnumConverter(typeDef, getType);
      case 'struct':
        return new StructConverter(typeDef, getType);
      case 'array':
        return new ArrayConverter(typeDef, getType);
      case 'typed-array':
        return new TypedArrayConverter(typeDef, getType);
      case 'map':
        return new MapConverter(typeDef, getType);
      default:
        throw new Error(`Unsupported type class ${typeName}`);
    }
  }
}

export type GetType = (typeName: string) => Converter;
