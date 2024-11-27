import { describe, it, expect, beforeAll } from 'vitest';
import { Protocols } from '../src/protocol/Protocols';
import type { ProtocolJSON } from '../src/protocol/Protocols.types';

describe('Protocols', () => {
  let testProtoData: ProtocolJSON;
  let protocols: Protocols;

  beforeAll(() => {
    testProtoData = {
      proto_id: 1,
      proto_name: 'messgen/test_proto',
      types: {
        simple_struct: {
          type_class: 'struct',
          fields: [
            { name: 'f0', type: 'uint64' },
            { name: 'f1', type: 'int64' },
          ],
        },
        simple_enum: {
          type_class: 'enum',
          base_type: 'uint8',
          values: [
            { name: 'one_value', value: 0 },
            { name: 'another_value', value: 1 },
          ],
        },
      },
      types_map: {
        0: 'simple_struct',
        1: 'simple_enum',
      },
    } as unknown as ProtocolJSON;
    protocols = new Protocols([testProtoData]);
  });

  describe('#constructor', () => {
    it('should correctly initialize protocols from JSON', () => {
      const protoMap = protocols.getProtocols();
      const [, proto] = protoMap.find(([name]) => name === 'messgen/test_proto') || [];

      expect(proto).toBeDefined();
      expect(proto?.id).toBe(1);
      expect(proto?.name).toBe('messgen/test_proto');
      expect(proto?.types.size).toBe(2);
      expect(proto?.messageIds.size).toBe(2);
    });
  });

  describe('#getType', () => {
    it('should resolve scalar types', () => {
      const type = protocols.getType('messgen/test_proto', 'uint64');
      expect(type).toEqual({
        type: 'uint64',
        typeClass: 'scalar',
      });
    });

    it('should resolve array types', () => {
      const type = protocols.getType('messgen/test_proto', 'uint64[4]');
      expect(type).toEqual({
        type: 'uint64[4]',
        typeClass: 'typed-array',
        elementType: 'uint64',
        arraySize: 4,
      });
    });

    it('should resolve dynamic array types', () => {
      const type = protocols.getType('messgen/test_proto', 'uint64[]');
      expect(type).toEqual({
        type: 'uint64[]',
        typeClass: 'typed-array',
        elementType: 'uint64',
        size: undefined,
      });
    });

    it('should resolve map types', () => {
      const type = protocols.getType('messgen/test_proto', 'string{int32}');
      expect(type).toEqual({
        type: 'string{int32}',
        typeClass: 'map',
        keyType: 'int32',
        valueType: 'string',
      });
    });

    it('should resolve struct types', () => {
      const type = protocols.getType('messgen/test_proto', 'simple_struct');
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
      const type = protocols.getType('messgen/test_proto', 'simple_enum');
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
        protocols.getType('messgen/test_proto', 'unknown_type');
      }).toThrow('Type not found: unknown_type in messgen/test_proto');
    });

    it('should resolve cross-protocol type references', () => {
      const type = protocols.getType('messgen/test_proto', 'messgen/test_proto/simple_struct');
      expect(type).toBeDefined();
      expect(type.typeClass).toBe('struct');
    });
  });
});
