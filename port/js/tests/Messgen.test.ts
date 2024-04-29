import { describe, it, expect, beforeAll } from 'vitest';
import { Messgen } from "../src/Messgen";
import { Types, ProtocolJSON, IType, IValue } from "../src/types";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { StructConverter } from "../src/converters/StructConverter";
import { Converter } from "../src/converters/Converter";
import { GlobalBasicConverters } from "../src/converters/BasicConverter";
import { IHeaderConverter, IHeader } from "../src/HEADER_STRUCT";
import { Buffer } from "../src/Buffer";

let testProtoData: ProtocolJSON;
let anotherProtoData: ProtocolJSON;
describe('Messgen', () => {
  beforeAll(() => {
    execSync(' npm run gen-json')
    const protocolPath = path.resolve(__dirname, './messgen/test_proto/protocol.json');
    const rawData = fs.readFileSync(protocolPath);
    // @ts-ignore
    testProtoData = JSON.parse(rawData);
    
    const anotherProtocolPath = path.resolve(__dirname, './another_proto/protocol.json');
    const anotherRawData = fs.readFileSync(anotherProtocolPath);
    // @ts-ignore
    anotherProtoData = JSON.parse(anotherRawData);
    
    
  })
  describe('init example', () => {
    it('should initialize the messages', () => {
      
      const messgen = new Messgen([testProtoData, anotherProtoData]);
      expect(messgen).toBeDefined();
      
    })
    
    it('should serialize and deserialize a message', () => {
      // Given
      const messgen = new Messgen([testProtoData, anotherProtoData]);
      let bigint = BigInt('0x1234567890abcdef');
      const rawData = {
        "f0": bigint,
        "f1": bigint,
        "f1_pad": 0x12,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f4": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "f9": true,
      }
      
      // When
      const message = messgen.serializeMessage('messgen/test_proto', 'simple_struct', rawData);
      const result = messgen.deserializeMessage(message);
      
      // Then
      expect(result).toEqual([{
        ...rawData,
        f5: expect.closeTo(rawData.f5, 5),
        __HEADER__: {
          "message_id": 0,
          "protocol_id": 1,
          "size": 42,
        }
      }]);
    })
    
    it('should surialize and deserialize a message with cors', () => {
      // Given
      const messgen = new Messgen([testProtoData, anotherProtoData]);
      const rawData = {
        f0: BigInt('0x1234567890abcdef'),
        cross0: 1,
      }
      
      // When
      const message = messgen.serializeMessage(
        'another_proto',
        'cross_proto',
        rawData
      );
      const result = messgen.deserializeMessage(message);
      
      // Then
      expect(result).toEqual([{
        ...rawData,
        __HEADER__: {
          "message_id": 0,
          "protocol_id": 0,
          "size": 17,
        }
      }]);
    })
    it('should serialize and deserialize with custom header ', () => {
      class CustomHeader extends StructConverter implements IHeaderConverter {
        protocol_id = 1
        
        constructor() {
          super('header', {
              "type_class": "struct",
              "fields": [
                { "name": "test_var", "type": "uint8" },
                { "name": "mes_id", "type": "uint8" },
                { "name": "size", "type": "uint32" }
              ]
            }, new Map<IType, Converter>(GlobalBasicConverters)
          )
        }
        
        serialize(value: {
          test_var: number,
        } & IHeader, buffer: Buffer): void {
          super.serialize({
            ...value,
            mes_id: value.message_id,
            protocol_id: this.protocol_id,
          }, buffer)
          
        }
        
        size(value: IValue): number {
          return super.size({
            ...value,
            mes_id: value.message_id,
            protocol_id: this.protocol_id,
          });
        }
        
        deserialize(buffer: Buffer): {
          test_var: number,
        } & IHeader {
          const data = super.deserialize(buffer);
          return {
            ...data,
            message_id: data.mes_id,
            protocol_id: this.protocol_id,
          }
        }
      }
      
      
      const messgen = new Messgen([testProtoData, anotherProtoData],
        new CustomHeader()
      );
      
      // Given
      let bigint = BigInt('0x1234567890abcdef');
      const rawData = {
        "f0": bigint,
        "f1": bigint,
        "f1_pad": 0x12,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f4": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "f9": true,
      }
      
      // When
      const message = messgen.serializeMessage('messgen/test_proto', 'simple_struct', rawData, {
        test_var: 0x12
      });
      const result = messgen.deserializeMessage(message);
      
      // Then
      expect(result).toEqual([{
        ...rawData,
        f5: expect.closeTo(rawData.f5, 5),
        __HEADER__: {
          "mes_id": 0,
          "message_id": 0,
          "protocol_id": 1,
          "size": 42,
          "test_var": 0x12
        }
      }]);
      
    })
    
    
  })
  describe('sortingTypesByDependency', () => {
    
    it('Returns a sorted array of entries based on their dependencies.', () => {
      // Given
      const json: Types = {
        type1: {
          type_class: "struct",
          fields: [
            {
              type: "type2",
              name: "field1"
            },
            {
              type: "type3",
              name: "field2"
            }
          ]
        },
        type2: {
          type_class: "struct",
          fields: [
            {
              type: "type3",
              name: "field1"
            }
          ]
        },
        type3: {
          type_class: "struct",
          fields: []
        }
      };
      
      // When
      const result = Messgen.sortingTypesByDependency(json);
      
      // Then
      expect(result).toEqual([
        ["type3", json.type3],
        ["type2", json.type2],
        ["type1", json.type1]
      ]);
    });
    
    it('Returns an empty array when the input is an empty object.', () => {
      // Given
      const json: Types = {};
      
      // When
      const result = Messgen.sortingTypesByDependency(json);
      
      // Then
      expect(result).toEqual([]);
    });
    
    it.skip('Throws an error when the input has circular dependencies.', () => {
      // Given
      const json: Types = {
        type1: {
          type_class: "struct",
          fields: [
            {
              type: "type2",
              name: "field1"
            }
          ]
        },
        type2: {
          type_class: "struct",
          fields: [
            { type: "type1", name: "field1" }
          ]
        }
      };
      
      // When
      const sortingTypesByDependency = () => Messgen.sortingTypesByDependency(json);
      
      // Then
      expect(sortingTypesByDependency).toThrowError("Circular dependency between type2 and type1");
    });
    
    
    it('Returns an array with entries sorted by their dependencies, when some entries have dependencies that are not defined in the input.', () => {
      // Given
      const json: Types = {
        type1: {
          type_class: "struct",
          fields: [
            { type: "type2", name: "field1" }
          ]
        },
        type2: {
          type_class: "struct",
          fields: [
            { type: "type3", name: "field1" }
          ]
        },
        type3: {
          type_class: "struct",
          fields: [
            { type: "type4", name: "field1" }
          ]
        }
      };
      
      // When
      const result = Messgen.sortingTypesByDependency(json);
      
      // Then
      expect(result).toEqual([
        ["type3", json.type3],
        ["type2", json.type2],
        ["type1", json.type1]
      ]);
    });
    it('should return a sorted array of entries based on their dependencies', () => {
      // Given
      const json: Types = {
        type1: {
          type_class: "struct",
          fields: [
            {
              type: "type2[]{int32}",
              name: "field1"
            },
            {
              type: "type3",
              name: "field2"
            }
          ]
        },
        type2: {
          type_class: "struct",
          fields: [
            {
              type: "type3",
              name: "field1"
            }
          ]
        },
        type3: {
          type_class: "struct",
          fields: []
        }
      };
      
      // When
      const result = Messgen.sortingTypesByDependency(json);
      
      // Then
      expect(result).toEqual([
        ["type3", json.type3],
        ["type2", json.type2],
        ["type1", json.type1]
      ]);
    });
  });
  it('should add tests for fields of EnumTypeClass', () => {
    // Given
    const json: Types = {
      type1: {
        type_class: "struct",
        fields: [
          { type: "type2", name: "field1" }
        ]
      },
      type2: {
        "type_class": "enum",
        "base_type": "uint8",
        "values": [
          {
            "name": "one_value",
            "value": 0,
          },
          {
            "name": "another_value",
            "value": 1,
          }
        ]
      }
    };
    
    // When
    const result = Messgen.sortingTypesByDependency(json);
    
    // Then
    expect(result).toEqual([
      ["type2", json.type2],
      ["type1", json.type1]
    ]);
  });
});
