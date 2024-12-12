import { describe, it, expect, beforeAll } from 'vitest';
import { Protocols } from '../src/protocol/Protocols';

describe('Protocols', () => {
  let protocols: Protocols;

  beforeAll(() => {
    protocols = new Protocols();
    protocols.load([
      {
        type: 'simple_struct',
        type_class: '8',
        fields: [
          { name: 'f0', type: 'uint64' },
          { name: 'f1', type: 'int64' },
        ],
      },
      {
        type: 'simple_enum',
        type_class: '7',
        base_type: 'uint8',
        values: [
          { name: 'one_value', value: 0 },
          { name: 'another_value', value: 1 },
        ],
      },
    ]);
  });

  describe('#getType', () => {
    it('should resolve scalar types', () => {
      const type = protocols.getType('uint64');
      expect(type).toEqual({
        type: 'uint64',
        typeClass: 'scalar',
      });
    });

    it('should resolve array types', () => {
      const type = protocols.getType('uint64[4]');
      expect(type).toEqual({
        type: 'uint64[4]',
        typeClass: 'typed-array',
        elementType: 'uint64',
        arraySize: 4,
      });
    });

    it('should resolve dynamic array types', () => {
      const type = protocols.getType('uint64[]');
      expect(type).toEqual({
        type: 'uint64[]',
        typeClass: 'typed-array',
        elementType: 'uint64',
        size: undefined,
      });
    });

    it('should resolve map types', () => {
      const type = protocols.getType('string{int32}');
      expect(type).toEqual({
        type: 'string{int32}',
        typeClass: 'map',
        keyType: 'int32',
        valueType: 'string',
      });
    });

    it('should resolve struct types', () => {
      const type = protocols.getType('simple_struct');
      expect(type).toEqual({
        typeClass: 'struct',
        typeName: 'simple_struct',
        fields: [
          { name: 'f0', type: 'uint64' },
          { name: 'f1', type: 'int64' },
        ],
      });
    });

    it('should resolve enum types', () => {
      const type = protocols.getType('simple_enum');
      expect(type).toEqual({
        typeClass: 'enum',
        typeName: 'simple_enum',
        type: 'uint8',
        values: [
          { name: 'one_value', value: 0 },
          { name: 'another_value', value: 1 },
        ],
      });
    });

    it('should throw error for unknown types', () => {
      expect(() => {
        protocols.getType('unknown_type');
      }).toThrow('Unknown type: unknown_type not found');
    });

    it('should resolve cross-protocol type references', () => {
      const type = protocols.getType('simple_struct');
      expect(type).toBeDefined();
      expect(type.typeClass).toBe('struct');
    });
  });
});
