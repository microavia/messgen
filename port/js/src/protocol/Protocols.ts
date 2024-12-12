import type { IBasicType, IName, IType, TypeDefinition } from '../types';
import { type RawType, TypeClass } from './Protocols.types';

const SCALAR_TYPES_INFO = new Map<string, boolean>([
  ['int8', true],
  ['uint8', true],
  ['int16', true],
  ['uint16', true],
  ['int32', true],
  ['uint32', true],
  ['int64', true],
  ['uint64', true],
  ['float32', true],
  ['float64', true],
  ['char', false],
  ['string', false],
  ['bytes', false],
  ['bool', false],
]);

export class Protocols {
  private types = new Map<IName, TypeDefinition>();

  load(types: RawType[]): void {
    types.forEach((type) => {
      if (type.type_class === TypeClass.STRUCT) {
        this.types.set(type.type, {
          typeClass: 'struct',
          fields: type.fields,
          typeName: type.type,
        });
      } else if (type.type_class === TypeClass.ENUM) {
        this.types.set(type.type, {
          typeClass: 'enum',
          type: type.base_type,
          typeName: type.type,
          values: type.values,
        });
      }
    });
  }

  getType(typeName: IType): TypeDefinition {
    if (SCALAR_TYPES_INFO.has(typeName)) {
      return { type: typeName as IBasicType, typeClass: 'scalar' };
    }
    if (typeName.endsWith(']')) {
      return this.parseArrayType(typeName);
    }
    if (typeName.endsWith('}')) {
      return this.parseMapType(typeName);
    }
    return this.resolveType(typeName);
  }

  private parseArrayType(typeName: string): TypeDefinition {
    const [elementType, size] = this.parseArray(typeName);

    const isTyped = SCALAR_TYPES_INFO.get(elementType);
    return {
      type: typeName,
      typeClass: isTyped ? 'typed-array' : 'array',
      elementType,
      arraySize: size,
    };
  }

  private parseMapType(typeName: string): TypeDefinition {
    const [keyType, valueType] = this.parseMap(typeName);
    return {
      type: typeName,
      typeClass: 'map',
      keyType,
      valueType,
    };
  }

  private parseArray(typeName: string): [string, number | undefined] {
    const parts = typeName.slice(0, -1).split('[');
    return [
      parts.slice(0, -1).join('['),
      parts[parts.length - 1] ? parseInt(parts[parts.length - 1], 10) : undefined,
    ];
  }

  private parseMap(typeName: string): [string, string] {
    const parts = typeName.slice(0, -1).split('{');
    return [parts[parts.length - 1], parts.slice(0, -1).join('{')];
  }

  private resolveType(typeName: string): TypeDefinition {
    const typeDefinition = this.types.get(typeName);
    if (!typeDefinition) {
      throw new Error(`Unknown type: ${typeName} not found`);
    }
    return typeDefinition;
  }
}
