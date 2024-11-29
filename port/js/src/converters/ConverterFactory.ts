import type { ProtocolName } from '../types';
import type { Converter } from './Converter';
import type { Protocols } from '../protocol/Protocols';
import {
  ScalarConverter,
  StructConverter,
  ArrayConverter,
  TypedArrayConverter,
  MapConverter,
  EnumConverter,
} from './base';

export class ConverterFactory {
  constructor(private protocols: Protocols) { }

  toConverter(protocolName: ProtocolName, typeName: string): Converter {
    const typeDef = this.protocols.getType(protocolName, typeName);
    const getType = this.toConverter.bind(this);

    switch (typeDef.typeClass) {
      case 'scalar':
        return new ScalarConverter(typeDef.type);
      case 'enum':
        return new EnumConverter(protocolName, typeDef, getType);
      case 'struct':
        return new StructConverter(protocolName, typeDef, getType);
      case 'array':
        return new ArrayConverter(protocolName, typeDef, getType);
      case 'typed-array':
        return new TypedArrayConverter(protocolName, typeDef, getType);
      case 'map':
        return new MapConverter(protocolName, typeDef, getType);
      default:
        throw new Error(`Unsupported type class ${typeName}`);
    }
  }
}

export type GetType = (protocolName: ProtocolName, typeName: string) => Converter;
