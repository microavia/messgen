import type { IBasicType, IName, IType, TypeDefinition } from '../types';
import type { RawType } from './Protocols.types';

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
      if (type.type_class === '8') {
        this.types.set(type.type, {
          typeClass: 'struct',
          fields: type.fields,
          typeName: type.type,
        });
      } else if (type.type_class === '7') {
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
      return {
        type: typeName as IBasicType,
        typeClass: 'scalar',
      };
    }

    if (typeName.endsWith(']')) {
      const [elementType, size] = this.parseArray(typeName);

      if (SCALAR_TYPES_INFO.get(elementType)) {
        return {
          type: typeName,
          typeClass: 'typed-array',
          elementType,
          arraySize: size,
        };
      }

      return {
        type: typeName,
        typeClass: 'array',
        elementType,
        arraySize: size,
      };
    }

    if (typeName.endsWith('}')) {
      const [valueType, keyType] = this.parseMap(typeName);
      return {
        type: typeName,
        typeClass: 'map',
        keyType,
        valueType,
      };
    }

    return this.resolveType(typeName);
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
    return [parts.slice(0, -1).join('{'), parts[parts.length - 1]];
  }

  private resolveType(typeName: string): TypeDefinition {
    const typeDefinition = this.types.get(typeName);

    if (!typeDefinition) {
      throw new Error(`Unknown type: ${typeName} not found`);
    }

    return typeDefinition;
  }
}
